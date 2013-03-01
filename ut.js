(function(window) {
"use strict";

var utEngine = function() {
    this.tests = {};
    this.testCount =
        this.successCount =
        this.failureCount = 0;
};

// private function, not exposed
var isArray;
if (Array.isArray) {
    isArray = function(obj) {
        return Array.isArray(obj);
    }
} else {
    isArray = function() {
        Object.prototype.toString.call(obj) == "[object Array]"
    }
}


// private function, not exposed
var triggerEvent = function(name, properties) {
    var event = document.createEvent("HTMLEvents");
    event.initEvent(name, true, false);
    
    for (var key in properties) {
        event[key] = properties[key];
    }
    
    window.dispatchEvent(event);
};

// private function, not exposed
var runOneTestOrAssertFunc = function(engine, func, context) {
    var success = true;
    var errorMessage = null;
    try {
        func.call(null, context, utThe);
        if (!engine.actAndWaitFunc) {
            ++engine.successCount;
        }
    } catch(e) {
        success = false;
        errorMessage = e.toString();
        engine.failures.push({
            name : engine.currentTestName,
            message : errorMessage
        });
        ++engine.failureCount;
    }
    
    if (func === engine.actAndWaitFunc) {
        delete engine.actAndWaitFunc;
    }
    if (func == engine.thenAssertFunc) {
        delete engine.thenAssertFunc;
    }
    
    if (!engine.actAndWaitFunc && !engine.thenAssertFunc) {
        triggerEvent("lbrtwUtTestEnded", {
            testName : engine.currentTestName,
            testIndex : engine.currentIndex,
            testSuccess : success,
            testErrorMessage : errorMessage,
            successCount : engine.successCount,
            failureCount : engine.failureCount,
            testCount : engine.testCount
        });
    }
};

utEngine.prototype = {
    add : function(name, testfunc) {
        if (this.tests[name]) throw name + " is already added";
        this.tests[name] = testfunc;
        ++this.testCount;
    },
    
    run : function() {
        if (this.initialized !== true) {
            this.initialized = true;

            this.failures = [];

            this.testNameIndex = 0;
            this.testNames = [];
            for (var name in this.tests) this.testNames.push(name);
            
            triggerEvent("lbrtwUtEngineStarting", {
                testCount : this.testCount
            });
        }
        
        this.running = true;

        if (this.actAndWaitFunc) {
            runOneTestOrAssertFunc(this, this.actAndWaitFunc, this.actAndWaitContext);

            delete this.actAndWaitFunc;
            var self = this;

            // pause the engine for a number of milliseconds
            this.actAndWaitTimeoutId = window.setTimeout(function() {
                delete this.actAndWaitTimeoutId;
                self.run();
            }, this.actAndWaitTimeout);

            return this;
        }
        
        if (this.thenAssertFunc) {
            runOneTestOrAssertFunc(this, this.thenAssertFunc, this.thenAssertContext);

            delete this.thenAssertFunc;
            delete this.thenAssertContext;
        }
        
        while (this.testNameIndex < this.testNames.length) {
            var index = this.testNameIndex;
            var name = this.testNames[this.testNameIndex++];
            var testFunc = this.tests[name];
            var context = new ut.TestContext(this);
            this.currentTestName = name;
            this.currentIndex = index;
            
            triggerEvent("lbrtwUtTestStarting", {
                testName : name,
                testIndex : index
            });
            runOneTestOrAssertFunc(this, testFunc, context);
            
            if (this.actAndWaitFunc) {
                var self = this;
                window.setTimeout(function() {
                    self.run();
                }, 0);
                return this;
            }
        }

        this.running = false;
        
        if (this.thenFunc) {
            this.thenFunc.call(null, this);
        }
        
        triggerEvent("lbrtwUtEngineEnded", {
            testCount : this.testCount,
            failureCount : this.failureCount,
            successCount : this.successCount,
            testNames : this.testNames,
            failures : this.failures
        });
        
        return this;
    },
    
    then : function(thenFunc) {
        if (this.running) {
            this.thenFunc = thenFunc;
        } else {
            thenFunc.call(null, this);
        }
    }
};

var utTestContext = function(engine) {
    this.engine = engine;
};

utTestContext.prototype = {
    actAndWait : function(timeout, actFunc) {
        this.engine.actAndWaitFunc = actFunc;
        this.engine.actAndWaitContext = this;
        this.engine.actAndWaitTimeout = timeout;
        return this;
    },
    
    thenAssert : function(assertFunc) {
        this.engine.thenAssertFunc = assertFunc;
        this.engine.thenAssertContext = this;
    },
    
    actDone : function() {
        var engine = this.engine;
        if (engine.actAndWaitContext === this) {
            if (engine.actAndWaitTimeoutId) {
                window.clearTimeout(engine.actAndWaitTimeoutId);
                delete engine.actAndWaitTimeoutId;
                
                window.setTimeout(function() {
                    engine.run();
                }, 0);
            }
        }
    }
};

var asserter = function(arg) {
    this.target = arg;
    this.valueName = "The value";
    this.methodName = "The function";
};

asserter.prototype = {
    methodOf : function(obj) {
        this.methodName = "The " + this.target + " method";

        this.target = (function(obj, name) {
            return obj[name];
        })(obj, this.target);

        return this;
    },
    
    withArguments : function() {
        var args = [].slice.call(arguments);
        
        this.target = (function(method, args) {
            return function() {
                method.apply(null, args);
            };
        })(this.target, args);
        
        return this;
    },
    
    shouldThrowAnError : function() {
        var threw = false;
        try {
            this.target.call();
        } catch (e) {
            threw = true;
        }
        if (!threw) {
            throw this.methodName + " did not throw an error";
        }
    },
    
    propertyOf : function(obj) {
        this.valueName = "The " + this.target + " property";
        this.target = obj[this.target];
        
        return this;
    },
    
    shouldBeNull : function() {
        if (this.target !== null) {
            throw this.valueName + " is not null";
        }
    },
    
    shouldNotBeNull : function() {
        if (this.target === null) {
            throw this.valueName + " is null";
        }
    },
    
    shouldBeExactly : function(arg) {
        if (this.target !== arg) {
            throw "Expected: exactly " + arg + ", " + this.valueName + ": " + this.target;
        }
    },
    
    shouldNotBeExactly : function(arg) {
        if (this.target === arg) {
            throw this.valueName + " is exactly " + arg;
        }
    },
    
    shouldBeLessThan : function(arg) {
        if (!(this.target < arg)) {
            throw "Expected: less than " + arg + ", " + this.valueName + ": " + this.target;
        }
    },
    
    shouldBeGreaterThan : function(arg) {
        if (!(this.target > arg)) {
            throw "Expected: greater than " + arg + ", " + this.valueName + ": " + this.target;
        }
    },
    
    shouldBeLessThanOrEqualTo : function(arg) {
        if (!(this.target <= arg)) {
            throw "Expected: less than or equal to " + arg + ", " + this.valueName + ": " + this.target;
        }
    },
    
    shouldBeGreaterThanOrEqualTo : function(arg) {
        if (!(this.target >= arg)) {
            throw "Expected: greater than or equal to " + arg + ", " + this.valueName + ": " + this.target;
        }
    },
    
    shouldBeTrue : function() {
        if (this.target !== true) {
            throw this.valueName + " is not true";
        }
    },
    
    shouldBeTruthy : function() {
        if (!this.target) {
            throw this.valueName + " is not truthy";
        }
    },
    
    shouldBeFalse : function() {
        if (this.target !== false) {
            throw this.valueName + " is not false";
        }
    },
    
    shouldBeFalsy : function() {
        if (this.target) {
            throw this.valueName + " is not falsy";
        }
    },
    
    shouldBeInstanceOf : function(theClass) {
        if (!(this.target instanceof theClass)) {
            throw this.valueName + " is not of correct type";
        }
    },
    
    shouldBeArray : function() {
        if (!isArray(this.target)) {
            throw this.valueName + " is not an array";
        }
    }
};

var utThe = function(arg) {
    return new asserter(arg);
};

window.ut = {
    "Engine" : utEngine,
    "TestContext" : utTestContext,
    "The" : utThe
};
    
})(this);