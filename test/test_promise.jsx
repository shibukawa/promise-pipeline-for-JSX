import "test-case.jsx";
import "promise.jsx";
import "console.jsx";

class TestPromise extends SyncPromise
{
    static var counter = 0;
    var task_finish_id : number;
    var dotask_called : boolean;

    function constructor (executor : Executor, id : string)
    {
        super(executor, id);
        this.task_finish_id = -1;
        this.dotask_called = false;
    }

    override function doTask () : variant
    {
        this.task_finish_id = TestPromise.counter++;
        this.dotask_called = true;
        return this.id();
    }
}


class _Test extends TestCase
{
    function test_single_run () : void
    {
        var executor = new Executor();
        var promise = new TestPromise(executor, 'id1');
        this.expect(promise.isFinished()).toBe(false);
        this.expect(executor.isFinished()).toBe(false);
        this.expect(promise.dotask_called).toBe(false);

        executor.run();

        this.expect(promise.dotask_called).toBe(true);
        this.expect(promise.isFinished()).toBe(true);
        this.expect(executor.isFinished()).toBe(true);
    }

    function test_parallel_run () : void
    {
        var executor = new Executor();
        var promise1 = new TestPromise(executor, 'id1');
        var promise2 = new TestPromise(executor, 'id2');

        this.expect(promise1.isFinished()).toBe(false);
        this.expect(promise2.isFinished()).toBe(false);
        this.expect(executor.isFinished()).toBe(false);

        executor.run();

        this.expect(promise1.isFinished()).toBe(false);
        this.expect(promise2.isFinished()).toBe(true);
        this.expect(executor.isFinished()).toBe(false);

        executor.run();

        this.expect(promise1.isFinished()).toBe(true);
        this.expect(promise2.isFinished()).toBe(true);
        this.expect(executor.isFinished()).toBe(true);
    }

    function test_sequential_run () : void
    {
        var executor = new Executor();
        var promise1 = new TestPromise(executor, 'id1');
        var promise2 = new TestPromise(executor, 'id2');
        promise1.use(promise2, "file");

        this.expect(promise1.isFinished()).toBe(false);
        this.expect(promise2.isFinished()).toBe(false);
        this.expect(executor.isFinished()).toBe(false);

        this.expect(promise1.depth()).toBe(1);
        this.expect(promise2.depth()).toBe(0);

        executor.run();

        this.expect(promise1.isFinished()).toBe(false);
        this.expect(promise2.isFinished()).toBe(true);
        this.expect(executor.isFinished()).toBe(false);

        executor.run();

        this.expect(promise1.isFinished()).toBe(true);
        this.expect(promise2.isFinished()).toBe(true);
        this.expect(executor.isFinished()).toBe(true);
    }

    function test_cache_hit () : void
    {
        var executor = new Executor();
        executor.setPreviousResult({
            'id1': {
                param: null,
                futures: {} : Map.<variant>,
                result: 'id1'
            }
        } : Map.<variant>);
        var promise = new TestPromise(executor, 'id1');

        executor.run();

        this.expect(promise.dotask_called).toBe(false);
        this.expect(promise.isFinished()).toBe(true);
        this.expect(executor.isFinished()).toBe(true);
    }
}
