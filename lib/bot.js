const Twit = require('twit')

class Bot {
    constructor () {
        this.twit = undefined;
        this.previouslyActiveDelegates = new Set();
    }

    start (container, options) {
        this.logger = container.resolvePlugin('logger');
        this.emitter = container.resolvePlugin('event-emitter');

        this.twit = new Twit({
            consumer_key: options.consumerKey,
            consumer_secret: options.consumerSecret,
            access_token: options.accessToken,
            access_token_secret: options.accessTokenSecret,
            timeout_ms: 5 * 1000
        });

        const context = { tweet: this.tweet };
        this.emitter.on('round.created', data => {
            if (this.previouslyActiveDelegates.size === 0) {
                this.previouslyActiveDelegates = new Set(data.map(wallet => wallet.attributes.delegate.username))
                return
            }
            const round = data[0].attributes.delegate.round
            const currentlyActiveDelegates = new Set(data.map(wallet => wallet.attributes.delegate.username))
            const droppedOutDelegates = new Set([...this.previouslyActiveDelegates].filter(x => !currentlyActiveDelegates.has(x)))

            for (const delegate of droppedOutDelegates) {
                console.log(`>>> tweeting about removed top 51 delegate: ${delegate}`)
                this.tweet(`🚨 ${delegate} got removed from forging position by Ark voters in round ${round} #arkecosystem #dpos #arkdelegates #ARK $ARK`)
            }
            const newDelegates = new Set([...currentlyActiveDelegates].filter(x => !this.previouslyActiveDelegates.has(x)))
            for (const delegate of newDelegates) {
                console.log(`>>> tweeting about a NEW top 51 delegate: ${delegate}`)
                this.tweet(`👏 ${delegate} got elected to be a forging delegate by Ark voters in round ${round} #arkecosystem #dpos #arkdelegates #ARK $ARK`)
            }
            this.previouslyActiveDelegates = currentlyActiveDelegates
        }, context)
    }

    async tweet (status) {
        try {
            await this.twit.post('statuses/update', { status: status })
        } catch (err) {
            this.logger.error(`There was an error posting this tweet: ${err}`)
        }
    }
}

module.exports = new Bot()
