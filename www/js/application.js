var app;

$(document).ready(function() {

    app = new Application();

    app.start();
});

function Application() {
    
    var PREFERENCE_CONTINUE = 0;
    var PREFERENCE_NO = 1;
    var PREFERENCE_OPEN = 2;
    var PREFERENCE_TRY = 3;
    
    var activities = new Array();
    
    var partnerAM;
    var partnerBM;

    var preferenceLabels = {};
    
    preferenceLabels[PREFERENCE_CONTINUE] = "We already enjoy this";
    preferenceLabels[PREFERENCE_NO] = "I don't think it's for me";
    preferenceLabels[PREFERENCE_OPEN] = "If my partner is interested";
    preferenceLabels[PREFERENCE_TRY] = "I would like to try it";
    
    var results = {};
    
    this.showAlert = function(title, message) {
        
        $("#alert .alert-title").text(title);
        $("#alert .alert-message").text(message);
        
        $("#alert").show();
    }
    
    this.hideAlert = function() {
        
        $("#alert").hide();
    }
    
    this.start = function() {
        
        var successHandler = function(data) {
            
            $(data).find("activity").each(function() {
            
            var i = $(this);
            
            var activity = new Activity(
                i.find("description").text(), 
                i.find("mm").text() == "true", 
                i.find("mf").text() == "true", 
                i.find("ff").text() == "true");
            
            activities.push(activity);});
            
            $("#loading").hide();
            $("#introduction").show();
        };
                
        var errorHandler = function() {
            
            $("#loading").text("The application data could not be loaded. ");
        };

        this.updateDemoResult();
        
        $.ajax({type: "GET", url: "xml/activities.xml", dataType: "xml", success: successHandler, error: errorHandler});

        //successHandler('<?xml version="1.0" encoding="UTF-8"?><activities>    <activity>        <mf>true</mf>        <mm>true</mm>        <ff>true</ff>        <description>Test activity A. </description>    </activity>    <activity>       <mf>false</mf>       <mm>false</mm>        <ff>true</ff>        <description>Test activity B. </description>    </activity>    <activity>        <mf>true</mf>        <mm>true</mm>        <ff>false</ff>        <description>Test activity C. </description>    </activity></activities>');
    }
    
    this.updateDemoResult = function() {
        
        var partnerAChoice = $("input[name='test_a']:checked", "#introduction");
        var partnerBChoice = $("input[name='test_b']:checked", "#introduction");
        
        var demoResult = $("#demo", "#introduction");
        
        if ((partnerAChoice.val()) && (partnerBChoice.val()))
        {
            var preferenceA = partnerAChoice.val();
            var preferenceB = partnerBChoice.val();
            
            var merged = mergePreferences(preferenceA, preferenceB);
            
            if (merged) { 
                
                demoResult.text("Recommended");
            }
            else {
                
                demoResult.text("Hidden");
            }
        }
        else {
            
            demoResult.text("?");
        }
    }
    
    this.introductionNext = function() {
        
        var partnerAAgreement = $("#partnerAAgreement").is(':checked');
        var partnerBAgreement = $("#partnerBAgreement").is(':checked');
        
        if ((partnerAAgreement) && (partnerBAgreement)) {
            
            this.hideAlert();
            
            $("#introduction").hide();
            
            window.scrollTo(0, 0);
            
            $("#genders").show();
        }
        else {
            
            this.showAlert("Oops!", "You must both tick the box to agree to answer honestly. ");
        }
    }
    
    this.gendersNext = function() {
        
        partnerAM = $("input[name='partnerAGender']:checked").val() === "Male";
        partnerBM = $("input[name='partnerBGender']:checked").val() === "Male";
        
        $("#genders").hide();
        
        window.scrollTo(0, 0);
        
        $("#partnerAReady").show();
    }

    this.partnerAReadyNext = function() {
    
        var root = $("#partnerAQuestions form ul.questions");
        
        appendQuestions(root, "a");
        
        $("#partnerAReady").hide();
        
        window.scrollTo(0, 0);
        
        $("#partnerAQuestions").show();
    }
    
    this.partnerANext = function() {
        
        if (allChecked($("#partnerAQuestions form"))) {
            
            this.hideAlert();
            
            $("#partnerAQuestions").hide();
            
            window.scrollTo(0, 0);
            
            $("#partnerBReady").show();
        }
        else {
            
            this.showAlert("Oops!", "You have not answered all of the questions. ");
        }
    }
    
    this.partnerBReadyNext = function() {
    
        var root = $("#partnerBQuestions form ul.questions");
        
        appendQuestions(root, "b");
        
        $("#partnerBReady").hide();
        
        window.scrollTo(0, 0);
        
        $("#partnerBQuestions").show();
    }
    
    this.partnerBNext = function() {
        
        if (allChecked($("#partnerBQuestions form"))) {
            
            this.hideAlert();
            
            $("#partnerBQuestions").hide();
            
            window.scrollTo(0, 0);
            
            $("#resultsReady").show();
        }
        else {
            
            this.showAlert("Oops!", "You have not answered all of the questions. ");
        }
    }
    
    this.resultsReadyNext = function() {
        
        gatherResults();
        
        fillResults($("#discuss"), 2);
        fillResults($("#roleplay"), 3);
        fillResults($("#try"), 4);
        
        $("#resultsReady").hide();
        
        window.scrollTo(0, 0);
        
        $("#results").show();
    }
    
    this.resultsNext = function() {
        
        $("#results").hide();
        
        window.scrollTo(0, 0);
        
        $("#feedback").show();
    }
    
    this.feedbackPrevious = function() {
        
        $("#feedback").hide();
        
        window.scrollTo(0, 0);
        
        $("#results").show();
    }
    
    this.save = function() {
        
        resultsString = "# Results\r\n\n";

        if (results.length > 0) {
            
            for (var i in results) {
                
                var activity = activities[i];
                
                resultsString += "* " + activity.getDescription() + "\r\n";
            }
        }
        else {
            
            resultsString += "None\r\n";
        }
        
        var blob = new Blob([resultsString], {type: "text/plain;charset=utf-8"});
        
        saveAs(blob, "Results.txt");
    }
    
    appendQuestions = function(root, partner) {
        
        var html = "";
        
        for (var i = 0; i < activities.length; i++) {
            
            var activity = activities[i];
            
            if (activity.isApplicable(partnerAM, partnerBM)) {
            
                html += "<li class='grouping'>";
                html += "<h3>&ldquo;" + activities[i].getDescription() + "&rdquo;</h3>";
                
                html += "<ul class='choices'>";
                
                for (var j in preferenceLabels) {
                    
                    var pref = preferenceLabels[j];
                    
                    var id = "preference_" + partner + "_" + i + "_" + j;
                    
                    html += "<li><input type='radio' id='" + id + "' name='activity_" + i + "' value='" + j + "' /><label for='" + id + "' class='accent-" + partner + "'>" + pref + "</label></li>";
                }
                
                html += "</ul>";
                
                html += "</li>";
            }
        }
        
        root.append(html);
    }
    
    gatherResults = function() {
        
        results = new Array();
        
        for (var i = 0; i < activities.length; i++) {
            
            var activity = activities[i];
            
            if (activity.isApplicable(partnerAM, partnerBM)) {
                
                var choiceA = $("input[name='activity_" + i + "']:checked", "#partnerAQuestions form").val();
                var choiceB = $("input[name='activity_" + i + "']:checked", "#partnerBQuestions form").val();
                
                var merged = mergePreferences(choiceA, choiceB);
                
                if (merged) {
                    
                    results += i;
                }
            }
        }
    }
    
    fillResults = function(root, preferenceIndex) {
        
        var html = "";
        
        if (results.length > 0) {
            
            html += "<ul>";
            
            for (var i in results) {
                
                var activity = activities[i];
                
                html += "<li><h3>" + '"' + activity.getDescription() + '"' + "</h3></li>";
            }
            
            html += "</ul>";
        }
        else {
            
            html += "<p><em>Sorry, no recommendations could be made. </em></p>";
        }
        
        root.append(html);
    }
    
    allChecked = function(root) {
        
        var names = {};
        
        $('input:radio', root).each(function() {
            
            names[$(this).attr('name')] = true;
        });
        
        var count = 0;
        
        $.each(names, function(key, value) {
            
            if (!$('input[name=' + key + ']', root).is(':checked')) {
                
                count++;
            }
        });	
        
        return (count == 0) ? true : false;
    }

    mergePreferences = function(preferenceA, preferenceB) {
        
        if ((preferenceA == PREFERENCE_CONTINUE) || (preferenceB == PREFERENCE_CONTINUE)) {
            
            return false;
        }
        else if ((preferenceA == PREFERENCE_NO) || (preferenceB == PREFERENCE_NO)) {
            
            return false;
        }
        else if ((preferenceA == PREFERENCE_TRY) || (preferenceB == PREFERENCE_TRY)) {
            
            return true;
        }
        else {
            
            return false;
        }
    }
}

function Activity(description, mm, mf, ff) {
    
    this.description = description;
    
    this.mm = mm;
    this.mf = mf;
    this.ff = ff;
    
    this.getDescription = function() {
        
        return this.description;
    }
    
    this.isApplicable = function(partnerAM, partnerBM) {
        
        if (partnerAM === true)
        {
            if (partnerBM === true)
            {
                return this.mm;
            }
            else
            {
                return this.mf;
            }
        }
        else
        {
            if (partnerBM === true)
            {
                return this.mf;
            }
            else
            {
                return this.ff;
            }
        }
    }
}
