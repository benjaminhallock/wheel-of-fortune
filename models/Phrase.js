class Phrase {
    constructor() {
        this.phrases = [
            "A blessing in disguise",
            "A dime a dozen",
            "Beat around the bush",
            "Better late than never",
            "Bite the bullet",
            "Break the ice",
            "Call it a day",
            "Cut somebody some slack",
            "Getting a taste of your own medicine",
            "Giving someone the cold shoulder"
        ];
    }

    getRandomPhrase() {
        const randomIndex = Math.floor(Math.random() * this.phrases.length);
        return this.phrases[randomIndex];
    }
}

module.exports = new Phrase();

