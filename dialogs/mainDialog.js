const { LuisRecognizer } = require('botbuilder-ai');
const { ComponentDialog, DialogSet, DialogTurnStatus, TextPrompt, WaterfallDialog,ChoiceFactory, ChoicePrompt } = require('botbuilder-dialogs');

const MAIN_DIALOG = "MainDialog";
const CHOICE_PROMPT = 'CHOICE_PROMPT';
const MAIN_WATERFALL_DIALOG = 'mainWaterfallDialog';

class MainDialog extends ComponentDialog {
    constructor(userState, conversationState, luisRecognizer, hrDialog, adminDialog,salesDialog) {
        super(MAIN_DIALOG);
        
        this.userState = userState;
        this.conversationState = conversationState;

        if (!luisRecognizer) throw new Error('[MainDialog]: Missing parameter \'luisRecognizer\' is required');
        this.luisRecognizer = luisRecognizer;

        this.addDialog(hrDialog);
        this.addDialog(adminDialog);
        this.addDialog(salesDialog);
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT))
        this.addDialog(new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
                this.introStep.bind(this),
                this.actStep.bind(this)
            ]));

        this.initialDialogId = MAIN_WATERFALL_DIALOG;
    }

    /**
     * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {*} turnContext
     * @param {*} accessor
     */
    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    async introStep(stepContext) {
        return await stepContext.prompt(CHOICE_PROMPT, {
            prompt:'Here are a few suggestions you can try', 
            choices: ChoiceFactory.toChoices(['HR', 'SALES', 'ADMIN'])
        });      
        }

    async actStep(stepContext) {

        if (this.luisRecognizer.isConfigured) {
        //console.log("inside act if", stepContext.result.value)
        const luisResult = await this.luisRecognizer.executeLuisQuery(stepContext.context);
        //console.log(luisResult)
        switch (LuisRecognizer.topIntent(luisResult)) {
        case 'HR': {
            return await stepContext.beginDialog('hrDialog');
        }

        case 'Admin': {
            return await stepContext.beginDialog('adminDialog');
            
        }

        case 'Sales': {
            return await stepContext.beginDialog('salesDialog');
        }

        case 'Help': {
            return await stepContext.replaceDialog(this.initialDialogId, { restartMsg: 'What else can I do for you?' });
        }

        default: {
            // Catch all for unhandled intents
            const didntUnderstandMessageText = `Sorry, I didn't get that. Please try asking in a different way (intent was ${ LuisRecognizer.topIntent(luisResult) })`;
            await stepContext.context.sendActivity(didntUnderstandMessageText, didntUnderstandMessageText);
        }
        }
    }
        return await stepContext.replaceDialog(this.initialDialogId, { restartMsg: 'What else can I do for you?' });
    }
    
}

module.exports.MainDialog = MainDialog;
module.exports.MAIN_DIALOG = MAIN_DIALOG;