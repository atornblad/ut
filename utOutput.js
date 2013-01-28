(function() {
    var success = document.getElementById("success");
    var failure = document.getElementById("failure");
    var info = document.getElementById("info");
    var tests = document.getElementById("tests");

    window.addEventListener("lbrtwUtTestStarting", function(event) {
        if (event.testName.substr(0, 6) != "inner:") {
            var li = document.createElement("LI");
            li.setAttribute("id", "test_" + event.testIndex);
            li.appendChild(document.createTextNode("Running " + event.testName + "..."));
            tests.appendChild(li);
        }
    });
    
    window.addEventListener("lbrtwUtTestEnded", function(event) {
        if (event.testName.substr(0, 6) != "inner:") {
            
            var successWidth = event.successCount * 800 / event.testCount;
            var totalWidth = (event.failureCount + event.successCount) * 800 / event.testCount;
            successWidth = Math.round(successWidth);
            totalWidth = Math.round(totalWidth);
            if (totalWidth > 800) totalWidth = 800;
            var failureWidth = totalWidth - successWidth;
            
            success.style.width = successWidth.toFixed(0) + "px";
            failure.style.width = failureWidth.toFixed(0) + "px";
            if (event.failureCount > 0) failure.style.display = "inline-block";
            
            var infoText = event.successCount + " successful, " + event.failureCount + " failed, out of " + event.testCount;
            info.innerHTML = infoText;
            
            var li = document.getElementById("test_" + event.testIndex);
            if (event.testSuccess) {
                li.innerHTML = "";
                li.className = "success";
                li.appendChild(document.createTextNode("Success: " + event.testName));
            } else {
                li.innerHTML = "";
                li.className = "failure";
                li.appendChild(document.createTextNode("Failure: " + event.testName + ", message: " + event.testErrorMessage));
            }
        }
    });
})();