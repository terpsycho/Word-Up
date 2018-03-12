// Base

var GAME_DURATION = 60;

var model = {
    
    gameHasStarted: false,

    secondsRemaining: GAME_DURATION,
    
    allowedLetters: [],

    currentAttempt: "",

    wordSubmissions: []
}

function startGame() {
    endGame();
    model.gameHasStarted = true;
    model.secondsRemaining = GAME_DURATION;
    model.allowedLetters = generateAllowedLetters();
    model.wordSubmissions = [];
    model.currentAttempt = "";
    model.timer = startTimer();
}

function endGame() {
    stopTimer();
}

function addNewWordSubmission(word) {
    var alreadyUsed = false;
    for (i = 0; i < model.wordSubmissions.length; i++) { 
        if (model.wordSubmissions[i].word === word) {
            alreadyUsed = true;
        }
        else {
            alreadyUsed = false;
        }
    }

    if (containsOnlyAllowedLetters(word) && alreadyUsed == false) {
        model.wordSubmissions.push({ word: word });
        checkIfWordIsReal(word);
    }
}

function checkIfWordIsReal(word) {

    $.ajax({
        url: "http://api.pearson.com/v2/dictionaries/lasde/entries?headword=" + word,
        success: function(response) {
            console.log("We received a response from Pearson!");

            console.log(response);

            if (jQuery.isEmptyObject(response.results) == true) {
                var theAnswer = false;
            }
            else {
                var theAnswer = true;
            }
            console.log(theAnswer);
       
            for (i = 0; i < model.wordSubmissions.length; i++) { 
                if (model.wordSubmissions[i].word === word) {
                    model.wordSubmissions[i].isRealWord = theAnswer;
                }
            }

            render();
        },
        error: function(err) {
            console.log(err);
        }
    });
}


// Rendering


function render() {

    $("#current-score").text(currentScore());
    $("#time-remaining").text(model.secondsRemaining);

    if (model.gameHasStarted == false) {
        $("#game").hide();
        return;
    }

    
    $("#allowed-letters").empty();
    $("#word-submissions").empty();
    $("#textbox").attr("disabled", false)
        .removeClass("bad-attempt");
    $(".disallowed-letter").remove();
   
    $("#game").show();

    var letterChips = model.allowedLetters.map(letterChip)
    $("#allowed-letters").append(letterChips);

    var submittedWordChips = model.wordSubmissions.map(wordSubmissionChip)
    $("#word-submissions").append(submittedWordChips);

    $("#textbox").val(model.currentAttempt)
        .focus();

    var disallowedLetters = disallowedLettersInWord(model.currentAttempt);
    if (disallowedLetters.length > 0) {
        $("#textbox").addClass("bad-attempt");

        var redLetterChips = disallowedLetters.map(disallowedLetterChip);

        $("#word-attempt-form").append(redLetterChips);

    }

    var gameOver = model.secondsRemaining <= 0
    if (gameOver) {
        $("#textbox").attr("disabled", true)
            .val("");
    }
}


function letterChip(letter) {
    var letterChip = $("<span></span>")
        .text(letter)
        .attr("class", "tag tag-lg allowed-letter")

    var scoreChip = $("<span></span>")
        .text(letterScore(letter))
        .attr("class", "tag tag-default tag-sm");

    return letterChip.append(scoreChip);
}

function wordSubmissionChip(wordSubmission) {
    var wordChip = $("<span></span>")
        .text(wordSubmission.word)
        .attr("class", "tag tag-lg word-submission");

    if (wordSubmission.hasOwnProperty("isRealWord")) {
        var scoreChip = $("<span></span>").text("⟐");
    
        if (wordSubmission.isRealWord == true) {
            var individualWordScore = wordScore(wordSubmission.word)
            scoreChip.text(individualWordScore)
            scoreChip.attr("class", "tag tag-primary tag-sm");
        }
        else {
            scoreChip.text("X")
            scoreChip.attr("class", "tag tag-danger tag-sm");
        }

        wordChip.append(scoreChip);

    }

    return wordChip;
}

function disallowedLetterChip(letter) {
    return $("<span></span>")
        .text(letter)
        .addClass("tag tag-sm tag-danger disallowed-letter");
}


// Dat Dom Stoofs

$(document).ready(function() {

    $("#new-game-button").click(function() {
        startGame();
        render();
    });

    $("#textbox").on('input', function() {
        model.currentAttempt = $("#textbox").val();
    });

   
    $("#word-attempt-form").submit(function(evt) {
        evt.preventDefault();
        addNewWordSubmission(model.currentAttempt);
        model.currentAttempt = "";
        render();
    });

    render();
});


// Dem Rulez

var scrabblePointsForEachLetter = {
    a: 1, b: 3, c: 3, d: 2, e: 1, f: 4, g: 2, h: 4, i: 1, j: 8, k: 5, l: 1, m: 3,
    n: 1, o: 1, p: 3, q: 10, r: 1, s: 1, t: 1, u: 1, v: 4, w: 4, x: 8, y: 4, z: 10
}

function isDisallowedLetter(letter) {
   
    let allowedIndex = model.allowedLetters.indexOf(letter)
    if (allowedIndex === -1) {
        return true;
    }
    else {
        return false;
    }
}

function disallowedLettersInWord(word) {
    letters = word.split("");
    return letters.filter(isDisallowedLetter);
}

function containsOnlyAllowedLetters(word) {

    disallowedList = disallowedLettersInWord(word);
    if (jQuery.isEmptyObject(disallowedList) === true) {
        return true;
    }
    else {
        return false;
    }
}

function generateAllowedLetters() {
    return chooseN(7, Object.keys(scrabblePointsForEachLetter));
}

function letterScore(letter) {
    return scrabblePointsForEachLetter[letter.toLowerCase()];
}

function wordScore(word) {
    
    var letters = word.split("");

    var letterScores = [];
    for (i = 0; i < letters.length; i++) { 
        individualLetterScore = letterScore(letters[i])
        letterScores.push(individualLetterScore)
    }

   
    return letterScores.reduce(add, 0);
}



function currentScore() {
    
    var wordScores = model.wordSubmissions.map(function(submission) {
        if (submission.isRealWord) {
            return wordScore(submission.word);
        }
        else {
            return 0;
        }
    });

    return wordScores.reduce(add, 0);
}

function chooseN(n, items) {
    var selectedItems = [];
    var total = Math.min(n, items.length);
    for (var i = 0; i < total; i++) {
        index = Math.floor(Math.random() * items.length);
        selectedItems.push(items[index]);
        items.splice(index, 1);
    }
    return selectedItems;
}

function add(a, b) {
    return a + b;
}


// Clock

function startTimer() {
    function tick() {
        return setTimeout(function() {
            model.secondsRemaining = Math.max(0, model.secondsRemaining - 1);
            render();
            var stillTimeLeft = model.gameHasStarted && model.secondsRemaining > 0
            if (stillTimeLeft) {
                model.timer = tick();
            }
        }, 1000);
    }
    return tick();
}
function stopTimer() {
    clearTimeout(model.timer);
}