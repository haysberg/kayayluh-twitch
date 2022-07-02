// const winston = require('winston');
import { ClientCredentialsAuthProvider } from '@twurple/auth';
import { ChatClient } from '@twurple/chat';

// We create the logger
// const logger = winston.createLogger({
// 	level: 'info',
// 	format: winston.format.json(),
// 	transports: [
// 		new winston.transports.File({ filename: 'kaylascream.log' }),
// 	],
// });

// logger.add(new winston.transports.Console({
// 	format: winston.format.simple(),
// }));


const clientId = 'gn23q4uf789f2f7l7mke96wopjmu9i';
const clientSecret = 'eeh4wp8cq30d0coxh0kbwswmni0dip';
const authProvider = new ClientCredentialsAuthProvider(clientId, clientSecret);

const chatClient = new ChatClient({ authProvider, channels: ['kaylascreambot'] });
await chatClient.connect();

const followAgeListener = chatClient.onMessage(async (channel, user, message, msg) => {
	if (message === '!followage') {
		const follow = await apiClient.users.getFollowFromUserToBroadcaster(msg.userInfo.userId, msg.channelId);

		if (follow) {
			const currentTimestamp = Date.now();
			const followStartTimestamp = follow.followDate.getTime();
			chatClient.say(channel, `@${user} You have been following for ${secondsToDuration((currentTimestamp - followStartTimestamp) / 1000)}!`);
		} else {
			chatClient.say(channel, `@${user} You are not following!`);
		}
	}
});

// later, when you don't need this command anymore:
chatClient.removeListener(followAgeListener);