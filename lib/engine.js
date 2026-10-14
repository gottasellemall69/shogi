import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { existsSync } from 'node:fs';
import path from 'node:path';

import { EngineError, requestScoped } from './engine-policy.js';
import { chooseEngineMove, difficultyProfile, MAX_CANDIDATES } from './difficulty.js';
export { EngineError, requestScoped, maxThinkingTime } from './engine-policy.js';

export function engineConfig() {
  const executable = path.resolve(process.env.YANEURAOU_ENGINE_PATH || (process.platform === 'linux' ? 'engines/linux/YaneuraOu' : 'engines/YaneuraOu-Deep-ORT-CPU.exe'));
  const cwd = path.resolve(process.env.YANEURAOU_ENGINE_CWD || path.dirname(executable));
  const evalDir = path.resolve(process.env.YANEURAOU_EVAL_DIR || (process.platform === 'linux' && !process.env.YANEURAOU_ENGINE_PATH ? 'engines/eval' : path.join(cwd, 'eval')));
  const model = process.env.YANEURAOU_MODEL || 'model-0000225kai.onnx';
  const architecture = process.env.YANEURAOU_MODEL_ARCHITECTURE || 'dlshogi-WCSC28';
  if (![executable, cwd, evalDir, model].every((value) => !/[\r\n\0]/.test(value))
      || !['dlshogi-WCSC28', 'dlshogi-WCSC35'].includes(architecture)) {
    throw new EngineError('Invalid engine configuration.');
  }
  if (!existsSync(executable) || !existsSync(path.resolve(evalDir, model))) {
    throw new EngineError('Engine or evaluation model is missing. Run npm run engine:setup, then retry.');
  }
  return { executable, cwd, evalDir, model, architecture, env: { ...process.env,
    ...(process.platform === 'linux' ? { LD_LIBRARY_PATH: `${cwd}${process.env.LD_LIBRARY_PATH ? `:${process.env.LD_LIBRARY_PATH}` : ''}` } : {}) } };
}

export default class ShogiEngine {
  constructor(configProvider = engineConfig, scoped = requestScoped()) {
    this.scoped = scoped;
    this.configProvider = configProvider;
    this.process = null;
    this.pending = null;
    this.busy = false;
    this.ready = false;
    this.name = null;
    this.options = new Set();
    this.candidates = new Map();
    this.lastDifficulty = null;
  }

  send(command) {
    if (!this.process || !this.process.stdin.writable) throw new EngineError('Engine process is unavailable.');
    this.process.stdin.write(`${command}\n`);
  }

  exchange(command, predicate, timeout) {
    return new Promise((resolve, reject) => {
      if (this.pending) return reject(new EngineError('An engine command is already pending.'));
      const timer = setTimeout(() => this.dispose(new EngineError('Engine timed out. Retry or check the model and engine configuration.', 504)), timeout);
      this.pending = { predicate, resolve, reject, timer };
      try { this.send(command); } catch (error) { this.dispose(error); }
    });
  }

  onLine(line) {
    if (line.startsWith('id name ')) this.name = line.slice(8);
    const option = /^option name (.+?) type /.exec(line);
    if (option) this.options.add(option[1]);
    if (line.startsWith('info ') && !line.startsWith('info string ')) {
      this.info = line.slice(0, 2000);
      const move = /\bpv ((?:[1-9][a-i][1-9][a-i]\+?|[PLNSGBR]\*[1-9][a-i]))(?:\s|$)/.exec(line)?.[1];
      const rank = Number(/\bmultipv (\d+)\b/.exec(line)?.[1] ?? 1);
      if (move && rank >= 1 && rank <= MAX_CANDIDATES) {
        // Each new rank-one line starts a fresh set of alternatives.
        if (rank === 1) this.candidates.clear();
        this.candidates.set(rank, { move, rank, info: this.info });
      }
    }
    if (this.pending?.predicate(line)) {
      const pending = this.pending;
      this.pending = null;
      clearTimeout(pending.timer);
      pending.resolve(line);
    }
  }

  setOption(name, value) {
    if (this.options.has(name)) this.send(`setoption name ${name} value ${value}`);
  }

  async start() {
    if (this.ready) return;
    const config = this.configProvider();
    this.options.clear();
    this.name = null;
    const child = spawn(config.executable, config.args || [], {
      cwd: config.cwd, env: config.env || process.env, windowsHide: true, shell: false, stdio: ['pipe', 'pipe', 'pipe'],
    });
    this.process = child;
    this.reader = createInterface({ input: child.stdout });
    this.reader.on('line', (line) => this.onLine(line));
    // Drain stderr without exposing local filesystem paths to the browser.
    child.stderr.on('data', () => {});
    child.stdin.on('error', () => {
      if (this.process === child) this.dispose(new EngineError('Engine input closed unexpectedly.'));
    });
    child.once('error', () => {
      if (this.process === child) this.dispose(new EngineError('Engine failed to start. Check its path, CPU compatibility, and runtime libraries.'));
    });
    child.once('exit', (code) => {
      if (this.process === child) this.dispose(new EngineError(`Engine exited unexpectedly (${code}). Check its model and runtime DLLs.`));
    });
    await this.exchange('usi', (line) => line === 'usiok', 10000);
    this.setOption('EvalDir', config.evalDir);
    this.setOption('DNN_Model', config.model);
    this.setOption('ModelArchitecture', config.architecture);
    this.setOption('USI_Ponder', 'false');
    this.setOption('USI_OwnBook', 'false');
    this.setOption('BookFile', 'no_book');
    this.setOption('UCT_Threads', 1);
    this.setOption('DNN_Batch_Size', 1);
    this.setOption('UCT_NodeLimit', 100000);
    this.setOption('PV_Mate_Search_Threads', 0);
    this.setOption('MinimumThinkingTime', 1);
    this.setOption('NetworkDelay', 0);
    this.setOption('NetworkDelay2', 0);
    this.setOption('RoundUpToFullSecond', 'false');
    this.setOption('EnteringKingRule', 'CSARule27');
    await this.exchange('isready', (line) => line === 'readyok', this.scoped ? 15000 : 60000);
    this.ready = true;
  }

  async runExclusive(task, signal) {
    if (this.busy) throw new EngineError('Engine is busy with another request. Please retry shortly.', 429);
    if (signal?.aborted) throw new EngineError('Engine request cancelled.', 499);
    this.busy = true;
    clearTimeout(this.idleTimer);
    const abort = () => this.dispose(new EngineError('Engine request cancelled.', 499));
    signal?.addEventListener('abort', abort, { once: true });
    try {
      await this.start();
      if (signal?.aborted) throw new EngineError('Engine request cancelled.', 499);
      return await task();
    } catch (error) {
      this.dispose(error);
      throw error;
    } finally {
      signal?.removeEventListener('abort', abort);
      if (this.scoped) await this.shutdown();
      else {
        this.idleTimer = setTimeout(() => this.dispose(), 60000);
        this.idleTimer.unref?.();
      }
      this.busy = false;
    }
  }

  status(signal) {
    return this.runExclusive(async () => ({ ready: true, name: this.name }), signal);
  }

  bestMove(moves, movetime = 1000, signal, difficulty = 'expert') {
    if (!Array.isArray(moves) || moves.length > 1024 || moves.some((move) => typeof move !== 'string'
      || !/^(?:[1-9][a-i][1-9][a-i]\+?|[PLNSGBR]\*[1-9][a-i])$/.test(move))) {
      throw new EngineError('Invalid USI move history.', 400);
    }
    if (!Number.isInteger(movetime) || movetime < 100 || movetime > (this.scoped ? 1000 : 10000)) throw new EngineError('Invalid thinking time.', 400);
    const profile = difficultyProfile(difficulty);
    const searchTime = Math.min(movetime, profile.maxMovetime);
    return this.runExclusive(async () => {
      // FukauraOu 9.40 retains its tree after usinewgame and does not honor its
      // ReuseSubtree option. Restart on level changes to discard stronger analysis.
      if (this.lastDifficulty && this.lastDifficulty !== difficulty) {
        await this.shutdown();
        if (signal?.aborted) throw new EngineError('Engine request cancelled.', 499);
        await this.start();
      }
      this.lastDifficulty = difficulty;
      this.info = null;
      this.candidates.clear();
      if (difficulty !== 'expert' && !this.options.has('MultiPV')) {
        throw new EngineError('This engine does not support difficulty levels. Choose Expert or use the bundled engine.');
      }
      // Reapply on every request: the local process can serve different levels.
      this.setOption('MultiPV', profile.weights.length);
      // Send the full game history so the engine can recognize repetition.
      this.send('usinewgame');
      await this.exchange('isready', (line) => line === 'readyok', 10000);
      this.send(`position startpos${moves.length ? ` moves ${moves.join(' ')}` : ''}`);
      const line = await this.exchange(`go movetime ${searchTime}`, (value) => value.startsWith('bestmove '), searchTime + (this.scoped ? 5000 : 15000));
      const choice = chooseEngineMove(line.split(/\s+/)[1], [...this.candidates.values()], difficulty);
      return { bestmove: choice.move, info: choice.info ?? this.info, name: this.name, difficulty };
    }, signal);
  }

  dispose(error = new EngineError('Engine stopped.')) {
    clearTimeout(this.idleTimer);
    const pending = this.pending;
    this.pending = null;
    if (pending) { clearTimeout(pending.timer); pending.reject(error); }
    this.ready = false;
    this.lastDifficulty = null;
    this.reader?.close();
    this.reader = null;
    const child = this.process;
    this.process = null;
    if (child) {
      this.stopping = new Promise((resolve) => {
        child.once('close', resolve);
        child.stdin.destroy();
        child.kill('SIGKILL');
      });
    }
  }
  async shutdown() {
    this.dispose();
    await this.stopping;
  }
}

export function getEngine() {
  const key = Symbol.for('shogi.yaneuraou.v940');
  if (!globalThis[key]) {
    globalThis[key] = new ShogiEngine();
    process.once('exit', () => globalThis[key]?.dispose());
  }
  return globalThis[key];
}
