(function() {
"use strict";

var engine = new ut.Engine();

// Requirement 1. eng = new ut.Engine() should create a new unit testing engine
// -- upon creating a new engine, the eng.testCount should be zero

engine.add("new ut.Engine should create a new unit testing engine",
    function() {
        // Act
        var eng = new ut.Engine();
        
        // Assert
        if (eng.testCount !== 0) {
            throw "Did not set testCount to zero";
        }
        return undefined; // to please Komodo
    });

// Requirement 2. eng.add(name, testfunc) should add a new unit test to the engine
// -- eng.tests[name] should point to the testfunc function
// -- the eng.testCount property should be increased

engine.add("add() should set tests[name] to func",
    function() {
        // Arrange
        var eng = new ut.Engine();
        var bar = function() {};
  
        // Act
        eng.add("inner:foo", bar);
  
        // Assert
        if (eng.tests["inner:foo"] !== bar) {
            throw "tests.foo does not point to bar";
        }
    });
  
engine.add("add() should increase testCount",
    function() {
        // Arrange
        var eng = new ut.Engine();
        var func = function() {};
  
        // Act
        eng.add("inner:foo", func);
  
        // Assert
        if (eng.testCount !== 1) {
            throw "Did not increase testCount";
        }
    });

// Requirement 3. eng.run() should run the test function of each added unit test once
// -- if running the test function throws an exception, that indicates a failed unit test
// -- all unit tests should always run, even if some unit test function crashes (or even all of them)

engine.add("run() should run each added test once",
    function() {
        // Arrange
        var eng = new ut.Engine();
        var called = [0, 0];
        var func1 = function() { called[0]++; };
        var func2 = function() { called[1]++; };
        eng.add("inner:func1", func1);
        eng.add("inner:func2", func2);
        
        // Act
        eng.run();
        
        // Assert
        if (called[0] !== 1) {
            throw "Did not call func1";
        }
        if (called[1] !== 1) {
            throw "Did not call func2";
        }
    });

engine.add("run() should run all tests even when crash",
    function() {
        // Arrange
        var eng = new ut.Engine();
        var called = 0;
        var func = function() {
            ++called;
            throw "Crash!";
        }
        eng.add("inner:Going once", func);
        eng.add("inner:Going twice", func);
        
        // Act
        eng.run();
        
        // Assert
        if (called !== 2) {
            throw "Did not call both added tests";
        }
    });

// Requirement 4. The engine should keep track of the number of failed/succeeded tests
// -- after eng.run() is done, the eng.successCount and eng.failureCount should contain the number
//    of succeeded/failed unit tests respectively, and the sum of them should be the same as eng.testCount

engine.add("The engine should count successes and failures",
    function() {
        // Arrange
        var eng = new ut.Engine();
        var failFunc = function() {
            throw "Crash!";
        };
        var successFunc = function() { };
        eng.add("inner:One fail", failFunc);
        eng.add("inner:Two fails", failFunc);
        eng.add("inner:Three fails", failFunc);
        eng.add("inner:One success", successFunc);
        
        // Act
        eng.run();
        
        // Assert
        if (eng.successCount !== 1) {
            throw "successCount should be 1, but is " + eng.successCount;
        }
        if (eng.failureCount !== 3) {
            throw "failureCount should be 3, but is " + eng.failureCount;
        }
    });

// Requirement 5. The engine should keep track of which tests fail/succeed
// -- after eng.run() is done, the eng.failures should contain a list of objects containing the name and
//    error message of each failing test

engine.add("The engine should keep track of which tests fail/succeed",
    function() {
        var eng = new ut.Engine();
        var failFunc = function() {
            throw "I did crash!";
        };
        eng.add("inner:Failing", failFunc);
        
        // Act
        eng.run();
        
        // Assert
        if (eng.failures.length !== 1) {
            throw "failures.length should be 1, but is " + eng.failures.length;
        }
        if (eng.failures[0].name != "inner:Failing") {
            throw "failures[0].name should be 'Failing', but is " + eng.failures[0].name;
        }
        if (eng.failures[0].message != "I did crash!") {
            throw "failures[0].message should be 'I did crash!', but is " + eng.failures[0].message;
        }
    });

// Requirement 6. Each test function should be called with a ut.TestContext object as its first argument
// -- testContext.actAndWait(timeout, actFunc) should run the actFunc function, and wait timeout milliseconds before continuing
// -- if the actFunc function crashes, the test is marked as a failed test
//    the actFunc function should receive a ut.TestContext object as its first argument
// -- calling testContext.actDone() from within an asynchronous test function stops the waiting immediately
// -- the testContext.actAndWait method should return the test context object itself, for call chaining purposes
// -- calling testContext.thenAssert(assertFunc) should make the assertFunc function get called after the actFunc function is
//    either timed out, or marked as done using the actDone() method
// -- the assertFunc function should receive a ut.TestContext object as its first argument
// -- if no assert function is registered, timing out to timeout milliseconds should assume a failing test, while a call to
//    actDone() should assume a successful test
//
// Requirement 7. The framework should provide a function hook to be called after all unit tests have been run
// -- the run() method of ut.Engine should return the engine itself
// --  the then(func) method should register a function to be run after all unit tests are done running, passing the engine as the
//     first parameter to the func function
// -- If none of the registered unit tests contain any asynchronous code, calling run() should run all tests before returning, and
//    the caller of run() shouldn’t need to use the then() method

engine.add("Test functions should be called with a ut.TestContext as its first argument",
    function() {
        // Arrange
        var innerTc;
        var eng = new ut.Engine();
        eng.add("inner:set inner test context", function(tc) {
            innerTc = tc;
        });
        
        // Act
        eng.run();
        
        // Assert
        if (!(innerTc instanceof ut.TestContext)) {
            throw "innerTc is not a ut.TestContext object";
        }
    });

engine.add("testContext.actAndWait should return the testContext itself",
    function() {
        // Arrange
        var innerTc;
        var returnedTc;
        var eng = new ut.Engine();
        eng.add("inner:set inner test context", function(tc) {
            innerTc = tc;
            returnedTc = tc.actAndWait(1, function() {});
        });
        
        // Act
        eng.run();
        
        // Assert
        if (innerTc !== returnedTc) {
            throw "actAndWait did not return the testContext itself";
        }
    });

engine.add("actAndWait(timeout, actFunc) should run the actFunc, and wait (at least) timeout milliseconds",
    function(testContext) {
        // Arrange
        var timeout = 100;
        var calledAt = 0, endedAt = 0;
        var eng = new ut.Engine();
        var actFunc = function() { calledAt = new Date().getTime(); }
        var testFunc = function(tc) { tc.actAndWait(timeout, actFunc); };
        eng.add("inner:actAndWait should wait correct amount of ms", testFunc);
        
        // Act
        testContext.actAndWait(timeout + 100, function() {
            eng.run().then(function() { endedAt = new Date().getTime(); });
        }).
        
        // Assert
        thenAssert(function() {
            if (calledAt == 0) {
                throw "Did not call the actFunc function";
            }
            if (endedAt == 0) {
                throw "Did not finish running the tests properly";
            }
            // Minor timing issue: five milliseconds off is not a big deal
            if (endedAt < calledAt + timeout - 5) {
                throw "Did not wait enough ms (waited " + (endedAt - calledAt) + " ms";
            }
        });
    });

engine.add("thenAssert(func) should called the assert function after (at least) the registered number of milliseconds",
    function(testContext) {
        // Arrange
        var timeout = 100;
        var calledAt = 0, assertedAt = 0;
        var eng = new ut.Engine();
        var actFunc = function() { calledAt = new Date().getTime(); };
        var assertFunc = function() { assertedAt = new Date().getTime(); };
        var testFunc = function(tc) {
            tc.actAndWait(timeout, actFunc).thenAssert(assertFunc);
        }
        eng.add("inner:thenAssert should wait correct amount of ms", testFunc);
        
        // Act
        testContext.actAndWait(timeout + 100, function() {
            eng.run();
        }).
        
        // Assert
        thenAssert(function() {
            if (calledAt == 0) {
                throw "Did not call the actFunc function";
            }
            if (assertedAt == 0) {
                throw "Did not call the assertFunc function";
            }
            // Minor timing issue: five milliseconds off is not a big deal
            if (assertedAt < calledAt + timeout - 5) {
                throw "Did not wait enough ms (waited " + (assertedAt - calledAt) + " ms";
            }
        });
    });

engine.add("if the actFunc for actAndWait crashes, the test should be failed",
    function(testContext) {
        // Arrange
        var eng = new ut.Engine();
        eng.add("inner:This should crash", function(tc) {
            tc.actAndWait(100, function() { throw "Crashing!"; });
        });
        
        // Run
        testContext.actAndWait(200, function() {
            eng.run();
        }).
        
        // Assert
        thenAssert(function() {
            if (eng.failures.length !== 1) {
                throw "Did not register exactly one failure";
            }
        });
    });

engine.add("then(func) should run func immediately if there are no asynchronous unit tests",
    function() {
        // Arrange
        var thenCalled = false;
        var eng = new ut.Engine();
        eng.add("inner:no-op test", function() { });
        
        // Run
        eng.run().then(function() { thenCalled = true; });
        
        // Assert
        if (!thenCalled) {
            throw "the thenFunc was not called";
        }
    });

engine.add("then(func) should NOT run func immediately if there are some asynchronous unit test",
    function() {
        // Arrange
        var thenCalled = false;
        var eng = new ut.Engine();
        eng.add("inner:async test", function(tc) {
            tc.actAndWait(100, function() { });
        });
        
        // Run
        eng.run().then(function() { thenCalled = true; });
        
        // Assert
        if (thenCalled) {
            throw "the thenFunc was called, but shouldn't!";
        }
    });

engine.add("then(func) should run func after all asynchronous tests are done",
    function(testContext) {
        // Arrange
        var thenCalled = false;
        var eng = new ut.Engine();
        eng.add("inner:async test", function(tc) {
            tc.actAndWait(100, function() { });
        });
        
        // Run
        testContext.actAndWait(200, function() {
            eng.run().then(function() { thenCalled = true; });
        }).
        
        // Assert
        thenAssert(function() {
            if (!thenCalled) {
                throw "the thenFunc wasn't called";
            }
        });
    });

engine.add("actDone() should move immediately to the thenAssert assert function",
    function(testContext) {
        // Arrange
        var calledAt = 0, assertAt = 0;
        var eng = new ut.Engine();
        eng.add("inner:10ms func with 10000ms timeout", function(tc) {
            tc.actAndWait(10000, function() {
                calledAt = new Date().getTime();
                window.setTimeout(function() {
                    tc.actDone();
                }, 10);
            }).thenAssert(function() {
                assertAt = new Date().getTime();
            });
        });
        
        // Act
        testContext.actAndWait(500, function() {
           eng.run(); 
        }).
        
        // Assert
        thenAssert(function() {
            if (assertAt === 0) {
                throw "Assert wasn't called!";
            }
            if (assertAt > (calledAt + 100)) {
                throw "Assert took way too long to get called!";
            }
        });
    });

engine.add("second argument to test functions should be the ut.The object",
    function() {
        // Arrange
        var eng = new ut.Engine();
        var theThe;
        eng.add("inner:Get the The", function(first, second) {
            theThe = second;
        });
        
        // Act
        eng.run();
        
        // Assert
        if (!theThe) {
            throw "Second argument null or missing";
        }
        if (theThe !== ut.The) {
            throw "Second argument isn't ut.The";
        }
    });

engine.add("calling the(func).shouldThrowAnError() should call func()",
    function() {
        // Arrange
        var called = false;
        var func = function() { called = true; };

        // Act
        try {
            ut.The(func).shouldThrowAnError();
        } catch(e) { }

        // Assert
        if (!called) {
            throw "func() wasn't called!";
        }
    });

engine.add("calling the(func).withArguments(...).shouldThrowAnError() should call func(...)",
    function() {
        // Arrange
        var theA, theB, theC;
        var func = function(a, b, c) {
            theA = a;
            theB = b;
            theC = c;
        };

        // Act
        try {
            ut.The(func).withArguments(1, 2, 3).shouldThrowAnError();
        } catch(e) { }

        // Assert
        if (theA !== 1) {
            throw "First argument was not passed";
        }
        if (theB !== 2) {
            throw "Second argument was not passed";
        }
        if (theC !== 3) {
            throw "Third argument was not passed";
        }
    });

engine.add("the('foo').methodOf(bar) should be the same as the(bar.foo)",
    function() {
        // Arrange
        var called = false;
        var bar = {
            foo : function() { called = true; }
        };
        
        // Act
        try {
            ut.The("foo").methodOf(bar).shouldThrowAnError();
        } catch(e) { }

        // Assert
        if (!called) {
            throw "bar.foo() was not called";
        }
    });

engine.add("the('foo').methodOf(bar) should be the same as the(bar.foo), part 2",
    function() {
        // Arrange
        var theA, theB;
        var bar = {
            foo : function(a, b) {
                theA = a;
                theB = b;
            }
        };

        // Act
        try {
            ut.The("foo").methodOf(bar).withArguments(1, 2).shouldThrowAnError();
        } catch(e) { }

        // Assert
        if (theA !== 1 || theB !== 2) {
            throw "bar.foo(1, 2) was not called";
        }
    });

engine.add("shouldThrowAnError() should not throw an error if some error was thrown",
    function() {
        // Arrange
        var errorThrown = false;
        var func = function() { throw "Expected failure"; };

        // Act
        try {
            ut.The(func).shouldThrowAnError();
        } catch (e) {
            errorThrown = true;
        }

        // Assert
        if (errorThrown) {
            throw "An error was thrown!";
        }
    });

engine.add("shouldThrowAnError() should throw an error if no error was thrown",
    function() {
        // Arrange
        var errorThrown = false;
        var func = function() { };

        // Act
        try {
            ut.The(func).shouldThrowAnError();
        } catch (e) {
            errorThrown = e.toString();
        }

        // Assert
        if (!errorThrown) {
            throw "No error was thrown!";
        }
        var expected = "The function did not throw an error";
        if (errorThrown != expected) {
            throw "The wrong error was thrown! Expected: '" + expected + "', actual: '" + errorThrown + "'";
        }
    });

engine.add("the('foo').methodOf(bar) should be the same as the(bar.foo), but change the error message",
    function() {
        // Arrange
        var errorThrown = false;
        var bar = {
            foo : function() { }
        };

        // Act
        try {
            ut.The("foo").methodOf(bar).shouldThrowAnError();
        } catch (e) {
            errorThrown = e.toString();
        }

        // Assert
        if (!errorThrown) {
            throw "No error was thrown!";
        }
        var expected = "The foo method did not throw an error";
        if (errorThrown != expected) {
            throw "The wrong error was thrown! Expected: '" + expected + "', actual: '" + errorThrown + "'";
        }
    });

var addAssertTestsForMethod = function(engine, methodName, goodValue, badValue, arg, expectedError) {
    if (typeof goodValue != "undefined") {
        var passingTestName = methodName + "() should not throw an error";
        var passingTestFunc = (function(methodName, goodValue, arg) {
            return function() {
                // Act
                ut.The(goodValue)[methodName](arg);
            };
        })(methodName, goodValue, arg);

        engine.add(passingTestName, passingTestFunc);
    }
    if (typeof badValue != "undefined") {
        var failingTestName = methodName + "() should throw an error";
        var namedFailingTestName = methodName + "() should throw an error with correct name";
        var failingTestFunc = (function(methodName, badValue, arg, expectedError) {
            return function() {
                // Arrange
                var errorThrown = false;
                
                // Act
                try {
                    ut.The(badValue)[methodName](arg);
                } catch (e) {
                    errorThrown = e;
                }
                
                // Assert
                if (!errorThrown) {
                    throw "Did not throw an error";
                }
                if (errorThrown != expectedError) {
                    throw "Did not throw the correct error. Expected: '" + expectedError + "', actual: '" + errorThrown + "'";
                }
            };
        })(methodName, badValue, arg, expectedError.replace(/%/, "The value"));
        var namedFailingTestFunc = (function(methodName, badValue, arg, expectedError) {
            return function() {
                // Arrange
                var errorThrown = false;
                var obj = { prop : badValue };
                
                // Act
                try {
                    ut.The("prop").propertyOf(obj)[methodName](arg);
                } catch (e) {
                    errorThrown = e;
                }
                
                // Assert
                if (!errorThrown) {
                    throw "Did not throw an error";
                }
                if (errorThrown != expectedError) {
                    throw "Did not throw the correct error. Expected: '" + expectedError + "', actual: '" + errorThrown + "'";
                }
            };
        })(methodName, badValue, arg, expectedError.replace(/%/, "The prop property"));

        engine.add(failingTestName, failingTestFunc);
        engine.add(namedFailingTestName, namedFailingTestFunc);
    }
};

var testClass = function() { this.foo = "bar"; };

addAssertTestsForMethod(engine, "shouldBeNull", null, 123, undefined, "% is not null");
addAssertTestsForMethod(engine, "shouldNotBeNull", 123, null, undefined, "% is null");
addAssertTestsForMethod(engine, "shouldBeExactly", 1, true, 1, "Expected: exactly 1, %: true");
addAssertTestsForMethod(engine, "shouldNotBeExactly", true, 1, 1, "% is exactly 1");
addAssertTestsForMethod(engine, "shouldBeLessThan", 1, 2, 2, "Expected: less than 2, %: 2");
addAssertTestsForMethod(engine, "shouldBeGreaterThan", 3, 2, 2, "Expected: greater than 2, %: 2");
addAssertTestsForMethod(engine, "shouldBeLessThanOrEqualTo", 2, 3, 2, "Expected: less than or equal to 2, %: 3");
addAssertTestsForMethod(engine, "shouldBeGreaterThanOrEqualTo", 2, 1, 2, "Expected: greater than or equal to 2, %: 1");
addAssertTestsForMethod(engine, "shouldBeTrue", true, 1, undefined, "% is not true");
addAssertTestsForMethod(engine, "shouldBeTruthy", 1, false, undefined, "% is not truthy");
addAssertTestsForMethod(engine, "shouldBeFalse", false, 0, undefined, "% is not false");
addAssertTestsForMethod(engine, "shouldBeFalsy", 0, true, undefined, "% is not falsy");
addAssertTestsForMethod(engine, "shouldBeInstanceOf", new testClass(), testClass, testClass, "% is not of correct type");

// Requirement 10. Events should be triggered on the window object at key points in time
// -- When run() is called, the lbrtwUtEngineStarting event should be triggered
// -- Before running one unit test, the lbrtwUtTestStarting event should be triggered
// -- After running one unit test, the lbrtwUtTestEnded event should be triggered
// -- After running the last unit test, the lbrtwUtEngineEnded event should be triggered
// -- The lbrtwUtEngineStarting event object should contain the testCount property
// -- The lbrtwUtTestStarting event object should contain the testName and testIndex properties
// -- The lbrtwUtTestEnded event object should contain the testName, testIndex, testSuccess, testErrorMessage,
//    testCount, successCount and failureCount properties
// -- The lbrtwEngineEnded event object should contain the testCount, successCount, failureCount, testNames
//    and failures properties

engine.add("Calling run() should trigger the lbrtwUtEngineStarting event once",
    function(testContext, the) {
        // Arrange
        var eng = new ut.Engine();
        var triggered = 0;
        var onStarting = function(event) {
            window.removeEventListener("lbrtwUtEngineStarting", onStarting, false);
            triggered++;
        };
        window.addEventListener("lbrtwUtEngineStarting", onStarting, false);
        
        // Act
        testContext.actAndWait(100, function() { eng.run(); }).
        
        // Assert
        thenAssert(function() {
            the(triggered).shouldBeExactly(1);
        })
    });

engine.add("The lbrtwUtEngineStarting event object should contain testCount",
    function(testContext, the) {
        // Arrange
        var eng = new ut.Engine();
        eng.add("inner:a", function() {});
        eng.add("inner:b", function() {});
        var testCount;
        var onStarting = function(event) {
            window.removeEventListener("lbrtwUtEngineStarting", onStarting, false);
            testCount = event.testCount;
        };
        window.addEventListener("lbrtwUtEngineStarting", onStarting, false);
        
        // Act
        testContext.actAndWait(100, function() { eng.run(); }).
        
        // Assert
        thenAssert(function() {
            the(testCount).shouldBeExactly(2);
        })
    });

engine.add("lbrtwUtTestStarting event should be triggered once per unit test",
    function(testContext, the) {
        // Arrange
        var eng = new ut.Engine();
        var triggered = {};
        var triggeredByIndex = [];
        eng.add("inner:a", function() {});
        eng.add("inner:b", function() {});
        var onTestStarting = function(event) {
            triggered[event.testName] = (triggered[event.testName] || 0) + 1;
            triggeredByIndex[event.testIndex] = (triggeredByIndex[event.testIndex] || 0) + 1;
        };
        window.addEventListener("lbrtwUtTestStarting", onTestStarting, false);
        
        // Act
        testContext.actAndWait(100, function() { eng.run().then(function() {
                window.removeEventListener("lbrtwUtTestStarting", onTestStarting, false);
            });
        }).
        
        // Assert
        thenAssert(function() {
            the("inner:a").propertyOf(triggered).shouldBeExactly(1);
            the("inner:b").propertyOf(triggered).shouldBeExactly(1);
            the(0).propertyOf(triggeredByIndex).shouldBeExactly(1);
            the(1).propertyOf(triggeredByIndex).shouldBeExactly(1);
        })
    });

engine.add("lbrtwUtTestEnded event should be triggered once per unit test",
    function(testContext, the) {
        // Arrange
        var eng = new ut.Engine();
        var results = {};
        eng.add("inner:a", function() {});
        eng.add("inner:b", function() { throw "Crash!"; });
        var onTestEnded = function(event) {
            results[event.testName] = {
                success : event.testSuccess,
                errorMessage : event.testErrorMessage,
                successCount : event.successCount,
                failureCount : event.failureCount,
                testCount : event.testCount
            };
        };
        window.addEventListener("lbrtwUtTestEnded", onTestEnded, false);
        
        // Act
        testContext.actAndWait(100, function() { eng.run().then(function() {
                window.removeEventListener("lbrtwUtTestEnded", onTestEnded, false);
            });
        }).
        
        // Assert
        thenAssert(function() {
            the("inner:a").propertyOf(results).shouldBeTruthy();
            the("success").propertyOf(results["inner:a"]).shouldBeTrue();
            the("errorMessage").propertyOf(results["inner:a"]).shouldBeNull();
            the("successCount").propertyOf(results["inner:a"]).shouldBeExactly(1);
            the("failureCount").propertyOf(results["inner:a"]).shouldBeExactly(0);
            the("testCount").propertyOf(results["inner:a"]).shouldBeExactly(2);

            the("inner:b").propertyOf(results).shouldBeTruthy();
            the("success").propertyOf(results["inner:b"]).shouldBeFalse();
            the("errorMessage").propertyOf(results["inner:b"]).shouldBeExactly("Crash!");
            the("successCount").propertyOf(results["inner:b"]).shouldBeExactly(1);
            the("failureCount").propertyOf(results["inner:b"]).shouldBeExactly(1);
            the("testCount").propertyOf(results["inner:b"]).shouldBeExactly(2);
        })
    });

engine.add("The lbrtwUtEngineEnded event object should contain testCount, failureCount, successCount, testNames and failures",
    function(testContext, the) {
        // Arrange
        var eng = new ut.Engine();
        eng.add("inner:a", function() {});
        eng.add("inner:b", function() {});
        eng.add("inner:c", function() { throw "Crash!"; });
        var testCount;
        var failureCount;
        var successCount;
        var testNames;
        var failures;
        
        var onEnded = function(event) {
            window.removeEventListener("lbrtwUtEngineEnded", onEnded, false);
            testCount = event.testCount;
            failureCount = event.failureCount;
            successCount = event.successCount;
            testNames = event.testNames;
            failures = event.failures;
        };
        window.addEventListener("lbrtwUtEngineEnded", onEnded, false);
        
        // Act
        testContext.actAndWait(100, function() { eng.run(); }).
        
        // Assert
        thenAssert(function() {
            the(testCount).shouldBeExactly(3);
            the(failureCount).shouldBeExactly(1);
            the(successCount).shouldBeExactly(2);
            the("length").propertyOf(testNames).shouldBeExactly(3);
            the("length").propertyOf(failures).shouldBeExactly(1);
        })
    });

    
engine.run();

})();
