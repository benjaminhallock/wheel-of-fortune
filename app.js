const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const app = express();
const Phrase = require('./models/Phrase');
const session = require('express-session'); // Add this line

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.set('view options', { layout: 'layout' });
app.engine('hbs', require('hbs').__express);

// Set up static file serving
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set up session middleware
app.use(session({
    secret: 'your-secret-key', // Replace with a strong secret key
    resave: false,
    saveUninitialized: true
}));

// Sample data for the wheel
const wheelSegments = [
    '100', '200', '300', '400', '500', '600', '700', '800', '900', 'Bankrupt', 'Lose a Turn'
];

// Store game state
let currentPhrase = '';
let displayedPhrase = '';
let guessedLetters = [];
let playerBalance = 0; // New variable to track player's balance
let canGuess = true; // New variable to track if the player can guess

// Function to initialize a new game
function initializeGame() {
    currentPhrase = Phrase.getRandomPhrase();
    displayedPhrase = currentPhrase.replace(/[A-Za-z]/g, '_').replace(/\s/g, '_____').split('').join(' ');
    playerBalance = 0; // Reset balance for a new game
    canGuess = true; // Allow guessing at the start of a new game
}

// Route for the Wheel of Fortune game
app.get('/wheel', (req, res) => {
    if (!currentPhrase) {
        initializeGame();
    }
    
    // Retrieve the previous spin amount from the session
    let result = req.session.spinAmount || 'Spin to start!';

    // Spin the wheel and allow guessing
    const randomIndex = Math.floor(Math.random() * wheelSegments.length);
    result = wheelSegments[randomIndex];

    // Update player balance based on the wheel result
    if (!isNaN(result)) { // Check if the result is a number
        req.session.spinAmount = parseInt(result); // Store spin amount in session
    } else if (result === 'Bankrupt') {
        playerBalance = 0;
        req.session.spinAmount = 0; // Reset spin amount in session
    }

    canGuess = true; // Allow guessing after spinning
    res.render('wheel', { 
        title: 'Wheel of Fortune', 
        result: req.session.spinAmount, // Use session spin amount
        displayedPhrase, 
        guessedLetters, 
        playerBalance,
        canGuess // Pass canGuess to the view
    });
});

// Sample route
app.get('/', (req, res) => {
    res.render('home', { title: 'Home' });
});

app.post('/guess', (req, res) => {
    const guess = req.body.guess.toLowerCase();
 
    let errorMessage = '';
    let successMessage = '';
    let spinAmount = req.session.spinAmount || 0; // Retrieve spin amount from session

       // Check if the guess is a letter
       if (!/^[a-zA-Z]$/.test(guess)) {
        errorMessage = 'Oops! Not a letter.';
        return res.render('wheel', { 
            title: 'Wheel of Fortune', 
            result: req.session.spinAmount,
            displayedPhrase, 
            guessedLetters, 
            playerBalance, 
            errorMessage,
            canGuess
        });
    }

    if (!canGuess) {
        errorMessage = 'You must spin again before guessing!';
    } else if (!guessedLetters.includes(guess)) {
        guessedLetters.push(guess);
        let newDisplayedPhrase = '';
        let correctGuessCount = 0;

        for (let i = 0; i < currentPhrase.length; i++) {
            if (guessedLetters.includes(currentPhrase[i].toLowerCase())) {
                newDisplayedPhrase += currentPhrase[i];
            } else if (currentPhrase[i] === ' ') {
                newDisplayedPhrase += '     '; // Add five spaces for spaces in the phrase
            } else {
                newDisplayedPhrase += '_';
            }
            newDisplayedPhrase += '   '; // Add larger space after each character
        }

        displayedPhrase = newDisplayedPhrase.trim(); // Remove trailing space

        if (correctGuessCount > 0) {
            // Calculate earnings based on the number of correct letters guessed
            playerBalance += spinAmount * correctGuessCount;
            successMessage = 'Hurray! Guess again.'; // Set success message
        } else {
            errorMessage = 'Incorrect guess! Spin again.';
            canGuess = false; // Disable further guesses until the player spins again
        }
    } else {
        errorMessage = 'You already guessed that letter!';
    }

    res.render('wheel', { 
        title: 'Wheel of Fortune', 
        result: req.session.spinAmount, // Ensure the spin amount is shown
        displayedPhrase, 
        guessedLetters, 
        playerBalance, 
        errorMessage,
        successMessage,
        canGuess // Pass canGuess to the view
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running at address: http://localhost:${PORT}`);
});
