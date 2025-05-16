// /lib/engine.js


export default class ShogiEngine {
    constructor ( commandPath ) {
        this.proc = ( commandPath, [], { stdio: 'pipe' } );
        this.rl = ( { input: this.proc.stdout } );
        this.isReady = false;
        this.pending = [];
        this._init();
    }

    _init() {
        // handshake USI
        this.send( 'usi' );

        if ( line === 'usiok' ) {
            // engine supports USI
            this.send( 'isready' );
        } else if ( line === 'readyok' ) {
            this.isReady = true;
            this._flushQueue();
        } else if ( line.startsWith( 'bestmove' ) ) {
            const [ , move ] = line.split( ' ' );
            if ( this._resolveBestmove ) {
                this._resolveBestmove( move );
                this._resolveBestmove = null;
            }
        }
        // you could also handle “info ...” lines here if you like
    }

    send( cmd ) {
        this.isReady
            ? this.proc.stdio.write( cmd + '\n' )
            : this.pending.push( cmd + '\n' );
    }

    _flushQueue() {
        this.pending.forEach( cmd => this.proc.stdio.write( cmd ) );
        this.pending = [];
    }

    async waitReady() {
        if ( !this.isReady ) {
            await new Promise( resolve => {
                const onReady = () => {
                    if ( this.isReady ) {
                        this.rl.off( 'line', onReady );
                        resolve();
                    }
                };
                this.rl.on( 'line', onReady );
            } );
        }
    }

    /** Set up the current position; moves is an array of USI-formatted moves */
    async position( moves = [] ) {
        await this.waitReady();
        const cmd = moves.length
            ? `position startpos moves ${ moves.join( ' ' ) }`
            : 'position startpos';
        this.send( cmd );
    }

    /** Ask the engine for its next move, returns a USI string like “7g7f” */
    async go() {
        await this.waitReady();
        this.send( 'go' );
        return new Promise( resolve => {
            this._resolveBestmove = resolve;
        } );
    }

    quit() {
        this.send( 'quit' );
        this.proc.stdio.end();
        this.rl.close();
    }
}
