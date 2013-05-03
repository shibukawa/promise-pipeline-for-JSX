import "console.jsx";

abstract class Promise
{
    var _executor : Executor;
    var _prevFutures : Map.<Future>;
    var _future : Future;
    var _id : string;
    var _finished : boolean;
    var _depth : int;
    var _used : boolean;
    var _param : variant;

    function constructor (executor : Executor, id : string)
    {
        this._executor = executor;
        this._prevFutures = {} : Map.<Future>;
        this._future = new Future();
        this._id = id;
        this._finished = false;
        this._depth = 0;
        this._used = false;
        this._param = null;
        executor._register(this);
    }

    function setParam (param : variant) : void
    {
        this._param = param;
    }

    function use (promise : Promise, name : string) : void
    {
        var depth = this.depth();
        if (this._used && depth < promise.depth())
        {
            var msg = "Promise " + this._id + " has already children but task depth is deeper lower than " + promise._id + ".";
            throw new Error(msg);
        }
        promise._used = true;
        this._depth = Math.max(depth, promise.depth() + 1);
        this._prevFutures[name] = promise.future();
    }

    function future () : Future
    {
        return this._future;
    }

    function futureValue(name : string) : variant
    {
        return this._prevFutures[name].value();
    }

    function finish (value : variant) : void
    {
        this._future._finish(value);
        this._executor._finish(this.id(), new Memoize(this._param, this._prevFutures, value));
        this._finished = true;
    }

    function finishWithCache (result : Memoize) : void
    {
        this._future._finish(result.result);
        this._executor._finish(this.id(), result);
        this._finished = true;
    }

    function isFinished () : boolean
    {
        return this._finished;
    }

    function depth () : int
    {
        return this._depth;
    }

    function id () : string
    {
        return this._id;
    }

    function __run (previousParam : variant) : void
    {
        if (!previousParam)
        {
            this._run();
        }
        else
        {
            var previous = new Memoize(previousParam);
            var current = new Memoize(this._param, this._prevFutures);
            if (previous.equals(current))
            {
                this.finishWithCache(previous);
            }
            else
            {
                this._run();
            }
        }
    }

    abstract function _run () : void;
}


__export__ abstract class SyncPromise extends Promise
{
    function constructor (executor : Executor, id : string)
    {
        super(executor, id);
    }

    abstract function doTask () : variant;

    override function _run () : void
    {
        var value = this.doTask();
        this.finish(value);
    }
}

__export__ abstract class ASyncPromise extends Promise
{
    function constructor (executor : Executor, id : string)
    {
        super(executor, id);
    }

    abstract function doTask () : void;

    override function _run () : void
    {
        this.doTask();
    }
}

class Future
{
    var _value : variant;

    function constructor ()
    {
        this._value = null;
    }

    function _finish (value : variant) : void
    {
        this._value = value;
    }

    function value () : variant
    {
        return this._value;
    }
}

class Memoize
{
    var futures : Map.<variant>;
    var param : variant;
    var result : variant;
    var empty : boolean;

    function constructor (input : variant)
    {
        if (input)
        {
            this.empty = false;
            this.futures = input["futures"] as Map.<variant>;
            this.param = input["param"];
            this.result = input["result"];
        }
        else
        {
            this.empty = true;
        }
    }

    function constructor (param : variant, futures : Map.<Future>)
    {
        this._init(param, futures);
    }

    function constructor (param : variant, futures : Map.<Future>, result : variant)
    {
        this._init(param, futures);
        this.result = result;
    }

    function _init (param : variant, futures : Map.<Future>) : void
    {
        this.empty = false;
        this.param = param;
        var values = {} : Map.<variant>;
        for (var key in futures)
        {
            if (futures.hasOwnProperty(key))
            {
                values[key] = futures[key].value();
            }
        }
        this.futures = values;
    }

    function equals (rhs : Memoize) : boolean
    {
        if (this.empty || rhs.empty)
        {
            return false;
        }
        if (this.param != rhs.param)
        {
            return false;
        }
        return Memoize.jsonCompare(this.futures, rhs.futures);
    }

    static function jsonCompare (a : variant, b : variant) : boolean
    {
        // http://jsfiddle.net/uKtEy/3/
        var seen = [] : variant[];

        return (function equals( x : variant, y : variant ) : boolean {
            if ( x == y ) {
                return true;
            }
            if ( ! ( x instanceof Object ) || ! ( y instanceof Object ) ) {
                return false;
            }
            if ( x["constructor"] != y["constructor"] ) {
                return false;
            }
            var xo = x as Map.<variant>;
            var yo = y as Map.<variant>;
            for ( var p in xo ) {
                if ( xo.hasOwnProperty( p ) ) {
                    if ( ! yo.hasOwnProperty( p ) ) {
                        return false;
                    }
                    if ( xo[ p ] == yo[ p ] ) {
                        continue;
                    }
                    if ( typeof( xo[ p ] ) != "object" ) {
                        return false;
                    }
                    if ( seen.indexOf( xo[ p ] ) != -1 ) {
                        throw new Error("Cannot compare some cyclical objects" );
                    }
                    seen.push( xo[ p ] );
                    if ( ! equals( xo[ p ],  yo[ p ] ) ) {
                        return false;
                    }
                }
            }

            for ( p in yo ) {
                if ( yo.hasOwnProperty( p ) && ! xo.hasOwnProperty( p ) ) {
                    return false;
                }
            }
            return true;
        } )( a, b );
    }
}

__export__ class DummyLock
{
}

__export__ class Executor
{
    var _previousResult : Map.<variant>;
    var _currentResult : Map.<Memoize>;
    var _futures : Future[];
    var _totalPromises : int;
    var _finishedPromises : int;
    var _readyPromises : Promise[];
    var _waitingPromises : Promise[];

    function constructor ()
    {
        this._currentResult = {} : Map.<Memoize>;
        this._previousResult = {} : Map.<variant>;
        this._futures = [] : Future[];
        this._totalPromises = 0;
        this._finishedPromises = 0;
        this._readyPromises = [] : Promise[];
        this._waitingPromises = [] : Promise[];
    }

    function setPreviousResult(previousResult : Map.<variant>) : void
    {
        this._previousResult = previousResult;
    }

    function _register (promise : Promise) : void
    {
        this._waitingPromises.push(promise);
        this._totalPromises++;
    }

    function _finish (id : string, memoize : Memoize) : void
    {
        this._finishedPromises++;
        this._currentResult[id] = memoize;
        // todo callback
    }

    function run () : void
    {
        if (this._readyPromises.length == 0)
        {
            if (this._waitingPromises.length == 0)
            {
                return;
            }
            this._readyPromises = this._waitingPromises;
            this._readyPromises.sort((a : Promise, b : Promise) -> ((b.depth() - a.depth()) as number));
            this._waitingPromises = [] : Promise[];
        }
        var promise = this._readyPromises.pop();
        promise.__run(this._previousResult[promise.id()]);
    }

    function isFinished () : boolean
    {
        return (this._finishedPromises == this._totalPromises);
    }
}
