const { ActivityHandler, MessageFactory } = require('botbuilder');

const WELCOMED_USER = 'welcomedUserProperty';
const USER_PROFILE_PROPERTY = 'userProfile';

class Bot extends ActivityHandler {

    /**
     *
     * @param {ConversationState} conversationState
     * @param {UserState} userState
     * @param {Dialog} dialog
    */

    constructor(conversationState, userState, dialog) {
        super();

        if (!conversationState) throw new Error('[DialogBot]: Missing parameter. conversationState is required');
        if (!userState) throw new Error('[DialogBot]: Missing parameter. userState is required');
        if (!dialog) throw new Error('[DialogBot]: Missing parameter. dialog is required');

        this.welcomedUserProperty = userState.createProperty(WELCOMED_USER);
        this.userProfileAccessor = userState.createProperty(USER_PROFILE_PROPERTY);
        this.conversationState = conversationState;
        this.userState = userState;
        this.dialog = dialog;
        this.dialogState = this.conversationState.createProperty('DialogState');


        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {
            const userProfile = await this.userProfileAccessor.get(context, {});
            const didBotWelcomedUser = await this.welcomedUserProperty.get(context, false);
            if (didBotWelcomedUser === false) {
                // The channel should send the user name in the 'From' object
                const id = context.activity.text;
                userProfile.empId = id;
                console.log(userProfile,this.userState)
                await context.sendActivity(`Thnx!!! I have ur Employee Id as ${id}`);
                await context.sendActivity("what can I do for you? You can type 'help' to start conversation.");

                // Set the flag indicating the bot handled the user's first message.
                await this.welcomedUserProperty.set(context, true);
                //console.log(input);
            } else {
                await this.dialog.run(context, this.dialogState);
                }
            await next();
        });

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            const welcomeText = 'Hello and welcome! I am your personal Assistant.You can type "help" any time to get help or "cancel" to cancel any conversation.';  
            const empmsg = "Please enter your employee ID."
            for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity(MessageFactory.text(welcomeText, welcomeText));
                    await context.sendActivity(MessageFactory.text(empmsg, empmsg));

                }
            }
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onDialog(async (context, next) => {
            // Save any state changes. The load happened during the execution of the Dialog.
            await this.conversationState.saveChanges(context, false);
            await this.userState.saveChanges(context, false);

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }
}

module.exports.Bot = Bot;