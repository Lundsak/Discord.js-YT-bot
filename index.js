// "node ." to run
//https://www.youtube.com/watch?v=q0lsD7U0JSI

const Discord = require("discord.js");
const {
	NoSubscriberBehavior,
	StreamType,
	createAudioPlayer,
	createAudioResource,
	entersState,
	AudioPlayerStatus,
	VoiceConnectionStatus,
	joinVoiceChannel,
} = require('@discordjs/voice');
const bot = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_VOICE_STATES"] });

const ytdl = require("ytdl-core");
require("dotenv").config();

const ytsr = require('ytsr');

const PREFIX = "!";

var servers = {};

bot.on("ready", () => {
    console.log("Bot is up and ready");
})



bot.on("messageCreate", async function(msg) {
    if(msg.content.substring(0 ,PREFIX.length) != PREFIX) {
        return;
    }
    let args = msg.content.substring(PREFIX.length).split(" ");

    switch(args[0].toLowerCase()) {
        case("p"):
            /**
             * Plays the next song in the queue
             * @param {*} msg messege to get guild.id
             */
            function play(msg) {
                console.log("Play called");
                
                var server = servers[msg.guild.id]
                var resource = createAudioResource(ytdl(server.queue[0], {
                    filter: "audioonly",
                    highWaterMark: 1<<25 
                }));
                server.player.play(resource);

                server.queue.shift();
            }

            /**
             * Safeley disconnect bot from server
             * @param {*} msg messege to get guild.id
             */
            function disconnect(msg) {
                var server = servers[msg.guild.id];
                
                try {
                    server.player.stop();
                    server.connection.destroy();
                } catch (error) {
                    msg.reply("I am not connected??? 🤰")
                }
                
                server = {
                    queue: [],
                    connection: null,
                    player: null
                }
                console.log("Disconnected from server")
            }

            async function queryYT(s) {
                let filters = await ytsr.getFilters(s);
                const filter = filters.get('Type').get('Video');
                const option = {
                    limit: 1,
                }
                const sr = await ytsr(filter.url, option);
                if(sr.results < 1) {
                    throw new Error('No result');
                }
                return sr.items[0].url;
            }

            // Check if there is a link after !p
            if(!args[1] ) {
                msg.channel.send("Put a link???");
                return;
            }

            // Check if user is connected to voice
            if(!msg.member.voice.channel) {
                msg.channel.send("Bruhh connect to voice");
                return;
            }

            // Initilase server
            if(!servers[msg.guild.id]) servers[msg.guild.id] = {
                queue: [],
                connection: null,
                player: null
            }
            
            // Check if given link is valid
            // QUERY YT if none valid link
            if(!ytdl.validateURL(args[1])) {
                try {
                    let sr = await queryYT(args[1])
                    console.log(sr);
                    var server = servers[msg.guild.id];
                    server.queue.push(sr);
                } catch (error) {
                    msg.reply("No reults found! 🤓");
                    return;
                }
                
                
            }
            else {
                var server = servers[msg.guild.id];
                server.queue.push(args[1]);
            }

            

            // Adds video to queue
            
            msg.react("🤰");
            msg.react("🚛");
            msg.react("🤠");
            console.log("Video added to queue");

            // If bot not connected to voice create connections
            if(!msg.guild.me.voice.channel) {
                console.log("Joining voice!")
                const vc = msg.member?.voice.channel

                server.connection = joinVoiceChannel({
                    channelId: vc.id,
                    guildId: vc.guild.id,
                    adapterCreator: vc.guild.voiceAdapterCreator,
                });

                server.player = createAudioPlayer({
                    behaviors: {
                        noSubscriber: NoSubscriberBehavior.Play,
                    },
                });

                server.connection.subscribe(server.player);
 
                play(msg);

                server.player.on(AudioPlayerStatus.Idle, () => {
                    if(server.queue[0]) {
                        play(msg);
                    }
                    else {
                        disconnect(msg);
                    }
                });
            }
        break;

        case("q"):
            // Tries to print whole queue
            try {
                var server = servers[msg.guild.id];
                var s = "Videos in queue:  \n";

                for (let i = 0; i < server.queue.length; i++) {
                    var ii = i + 1;
                    s += "Video "+  ii  + ": " + server.queue[i] + " \n";            
                }
                if(!server.queue.length) {
                    throw new Error('Queue empty');
                }
                msg.reply(s);

            } catch (error) {
                msg.reply("Queue is empty 🤡🤡🤡🤡");
                return;
            }
        break;

        case("s"):
            // Skip song if possible
            if(servers[msg.guild.id].queue[0]) {
                play(msg);
            }
            else {
                disconnect(msg);
            }
            
        break

        case("h"): 
            // Print help
            msg.reply(
                "To play a video: " + PREFIX + "p <Youtube URL> \nTo show queue: " + PREFIX + "q  \nTo skip a video: " + PREFIX + "s  \nTo KYS: " + PREFIX + "k \n"
                );
        break;

        case("k"):
            disconnect(msg);
        break;
        
    }
})

bot.login(process.env.token);