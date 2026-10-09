const { SlashCommandBuilder, MessageFlags, ContainerBuilder } = require('discord.js');
const omdb_key = process.env.omdb_key;
const fs = require('fs');
const path = require('path');

module.exports = {
	data: new SlashCommandBuilder()
        .setName('create_poll')
        .setDescription('Pulls 4 movies from list and creates a poll.'),
	async execute(interaction) {
        // read from file
        // randomly select 4 movies
        // get data for movies: year, poster, rating, plot synopsis - should this info be saved in file? no - not very costly to look up again
        const movie_file_path = path.join(__dirname, '../../');
        
        const file = fs.readFileSync(`${movie_file_path}movie-data.json`, function (err){
            if (err){
                console.log(err)
            }
        });
        
        let movies = JSON.parse(file);
        let object_keys = Object.keys(movies.movies);
        let rand_movies = [];

        for (let i = 0; i < 4; i++){
            let new_movie = object_keys[Math.floor(Math.random() * object_keys.length)]
            while (new_movie in rand_movies){
                new_movie = object_keys[Math.floor(Math.random() * object_keys.length)]
            }
            const response = await fetch(`http://www.omdbapi.com/?&i=${new_movie}&apikey=${omdb_key}`)
            console.log(new_movie);
            rand_movies.push(await response.json());
        }


        let movie_container = new ContainerBuilder()
        .setAccentColor(0xcf13cf)
        .addSectionComponents((section) =>
            section.addTextDisplayComponents((textDisplay) => 
                textDisplay.setContent(`## [${rand_movies[0].Title} (${rand_movies[0].Year})](https://www.imdb.com/title/${rand_movies[0].imdbID})\n${rand_movies[0].Plot}\n\n${rand_movies[0].Genre}`)
            )
            .setThumbnailAccessory((thumbnail) => thumbnail.setURL(`${rand_movies[0].Poster}`))
        )
        .addSeparatorComponents((separator) => separator)
        .addSectionComponents((section) =>
            section.addTextDisplayComponents((textDisplay) => 
                textDisplay.setContent(`## [${rand_movies[1].Title} (${rand_movies[1].Year})](https://www.imdb.com/title/${rand_movies[1].imdbID})\n${rand_movies[1].Plot}\n\n${rand_movies[0].Genre}`)
            )
            .setThumbnailAccessory((thumbnail) => thumbnail.setURL(`${rand_movies[1].Poster}`))
        )
        .addSeparatorComponents((separator) => separator)
        .addSectionComponents((section) =>
            section.addTextDisplayComponents((textDisplay) => 
                textDisplay.setContent(`## [${rand_movies[2].Title} (${rand_movies[2].Year})](https://www.imdb.com/title/${rand_movies[2].imdbID})\n${rand_movies[2].Plot}\n\n${rand_movies[0].Genre}`)
            )
            .setThumbnailAccessory((thumbnail) => thumbnail.setURL(`${rand_movies[2].Poster}`))
        )
        .addSeparatorComponents((separator) => separator)
        .addSectionComponents((section) =>
            section.addTextDisplayComponents((textDisplay) => 
                textDisplay.setContent(`## [${rand_movies[3].Title} (${rand_movies[3].Year})](https://www.imdb.com/title/${rand_movies[3].imdbID})\n${rand_movies[3].Plot}\n\n${rand_movies[0].Genre}`)
            )
            .setThumbnailAccessory((thumbnail) => thumbnail.setURL(`${rand_movies[3].Poster}`))
        )

        interaction.channel.send({
            components: [movie_container],
            flags: MessageFlags.IsComponentsV2,
        })

        interaction.reply({ 
            poll: {
                question: { text: "Pick a movie!" },
                answers: [
                    { text: rand_movies[0].Title },
                    { text: rand_movies[1].Title },
                    { text: rand_movies[2].Title },
                    { text: rand_movies[3].Title },
                ],
                allowMultiSelect: false,
                duration: 1,
            }
        });
    }
}