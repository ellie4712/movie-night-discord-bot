const { Events, MessageFlags } = require('discord.js');
const omdb_key = process.env.omdb_key;
const fs = require('fs');
const path = require('path');
const movie_file_path = path.join(__dirname, '../');

async function watch_movie(movie_name) {
    let api_url = "http://www.omdbapi.com/?&t=" + movie_name + "&apikey=" + omdb_key;

    const response = await fetch(api_url);
    const response_data = await response.json();
                        
    const file = fs.readFileSync(`${movie_file_path}movie-data.json`, function (err){
        if (err){
            console.log(err)
        }
    });

    let movies = JSON.parse(file);
    movies.watched[`${response_data.imdbID}`] = `${response_data.Title}`;
    delete movies.movies[`${response_data.imdbID}`];


    fs.writeFile(`${movie_file_path}movie-data.json`, JSON.stringify(movies), function (err){
        if (err) throw err;
    })
}

async function get_winner(poll) {
    let max_count = 0;
    let answer_list = []

    poll.answers.each((answer, num) => {
        if (answer.voteCount > max_count){
            answer_list = [];
            answer_list.push(answer.text);
            max_count = answer.voteCount;
        }
        else if (answer.voteCount == max_count){
            answer_list.push(answer.text);
        }
    });

    if (answer_list.length > 1){
        let new_list = []
        for (answer in answer_list){
            let test = {};
            test['text'] = answer_list[answer];
            new_list.push(test);
        }
        newMessage.channel.send({
            poll: {
            question: { text: "Tiebreaker!" },
            answers: new_list,
            allowMultiSelect: false,
            duration: 2,
        }});
    }
    
    else if (answer_list.length == 1){
        await watch_movie(answer_list[0])
    }
}

module.exports = {
    name: Events.MessageUpdate,
    async execute(oldMessage, newMessage){
        if (newMessage.poll != null){
            if (newMessage.poll.resultsFinalized){
                if (newMessage.poll.question.text === "Pick a movie!" || newMessage.poll.question.text === "Tiebreaker!"){
                   await get_winner(newMessage.poll);
                }
            }
        }
    }
}