// functionality: looks up a movie in open imdb database when a user enters in a movie.
// can save imdb id, maybe use to provide link to imdb? 
// shows user the found movie, ask to confirm it is the correct movie, if not - come back to that?
const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const omdb_key = process.env.omdb_key;
const fs = require('fs');
const path = require('path');

module.exports = {
	data: new SlashCommandBuilder()
        .setName('add_movie')
        .setDescription('Add a movie to the list!')
        .addStringOption((option) => option.setName('movie').setDescription('The movie to add to the list.').setRequired(true))
        .addIntegerOption((option) => option.setName('year').setDescription('The year the movie came out (optional)')),
	async execute(interaction) {
		// get options
        const movie = interaction.options.getString('movie');
        const year = interaction.options.getInteger('year') ?? null;

        // send api request
        let api_url = "";
        if (year === null){
            api_url = "http://www.omdbapi.com/?&t=" + movie + "&apikey=" + omdb_key;
        }
        else{
            api_url = "http://www.omdbapi.com/?&t=" + movie + "&y=" + year + "&apikey=" + omdb_key;
        }

        const response = await fetch(api_url);
        const response_data = await response.json();

        console.log(response_data);

        if (response_data.Response === 'False'){
            await confirmation.update({content: "Movie not found. Maybe you misspelled it?"})
        }
        else {
            let movieEmbed;

            if (response_data.Poster === 'N/A'){
                movieEmbed = new EmbedBuilder()
                .setTitle(response_data.Title + " (" + response_data.Year + ") - IMDB")
                .setDescription(response_data.Plot)
                .setURL("https://www.imdb.com/title/" + response_data.imdbID)
            } else {
                movieEmbed = new EmbedBuilder()
                .setTitle(response_data.Title + " (" + response_data.Year + ") - IMDB")
                .setDescription(response_data.Plot)
                .setURL("https://www.imdb.com/title/" + response_data.imdbID)
                .setImage(response_data.Poster)
            }

            const confirm = new ButtonBuilder().setCustomId('confirm').setLabel('Add').setStyle(ButtonStyle.Primary);
            const cancel = new ButtonBuilder().setCustomId('cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger);
            const row = new ActionRowBuilder().addComponents(confirm, cancel);

            const movie_message = await interaction.reply({ 
                embeds: [movieEmbed],
                components: [row],
                content: "Is this movie correct?",
                withResponse: true,
            });
        
            const collectorFilter = (i) => i.user.id === interaction.user.id;

            try {
                const confirmation = await movie_message.resource.message.awaitMessageComponent( {filter: collectorFilter, time: 60_000});
            
                if (confirmation.customId ===  'confirm'){
                    const movie_file_path = path.join(__dirname, '../../');

                    const file = fs.readFileSync(`${movie_file_path}movie-data.json`, function (err){
                        if (err){
                            console.log(err)
                        }
                    });

                    let movies = JSON.parse(file);
                    let reply;
                    let add_movie = true;

                    for (const movie in movies.movies){
                        if (movie === response_data.imdbID){
                            add_movie = false;
                            break;
                        }
                    }

                    if (add_movie){
                        // add to list
                        movies.movies[`${response_data.imdbID}`] = `${response_data.Title}`
                        fs.writeFile(`${movie_file_path}movie-data.json`, JSON.stringify(movies), function (err){
                            if (err) throw err;
                        })
                
                        reply = `${response_data.Title} added to movie list!`;
                    }
                    else {
                        reply = `${response_data.Title} already in list!`;
                    }

                    await confirmation.update({ content: reply, components: []});

                }

                else {
                    await confirmation.update({content: "Movie not added. Try searching with a title and year.", components: []});
                }
            }

            catch (err) {
                console.log(err);
                await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
            }
        }
	},
};