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

const PREFIX = "!";

var servers = {};

bot.on("ready", () => {
    console.log("Bot is upp and ready");
})



bot.on("messageCreate", msg => {

    let args = msg.content.substring(PREFIX.length).split(" ");

    switch(args[0].toLowerCase()) {
        case("p"):
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

            function disconnect(msg) {
                var server = servers[msg.guild.id];
                        server.player.stop();
                        server.connection.destroy();
                        server = {
                            queue: [],
                            connection: null,
                            player: null
                        }
            }

            if(!args[1] ) {
                msg.channel.send("Put a link???");
                return;
            }

            if(!msg.member.voice.channel) {
                msg.channel.send("Bruhh connect to voice");
                return;
            }
            
            if(!ytdl.validateURL(args[1])) {
                msg.reply("Plox insert valid Youtube URL");
                return;
            }

            if(!servers[msg.guild.id]) servers[msg.guild.id] = {
                queue: [],
                connection: null,
                player: null
            }

            var server = servers[msg.guild.id];
            server.queue.push(args[1]);
            msg.reply("Video added to queue")
            console.log("Video added to queue");

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
                        noSubscriber: NoSubscriberBehavior.Pause,
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
            if(servers[msg.guild.id].queue[0]) {
                play(msg);
            }
            else {
                disconnect(msg);
            }
            
        break

        case("h"):
            msg.reply(
                "To play a video: " + PREFIX + "p <Youtube URL> \n To showe queue: " + PREFIX + "q  \n To skip a video: " + PREFIX + "s  \n To KYS: " + PREFIX + "k \n"
                );
        break;

        case("k"):
            disconnect(msg);
        break;
        
    }
})

bot.login(process.env.token);