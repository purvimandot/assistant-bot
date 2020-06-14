const { TextPrompt, WaterfallDialog, ComponentDialog, ChoiceFactory, ChoicePrompt } = require('botbuilder-dialogs');

const TEXT_PROMPT = 'textPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';
const ADMIN_DIALOG = 'adminDialog';
const CHOICE_PROMPT = 'CHOICE_PROMPT';


class adminDialog extends ComponentDialog {
    constructor(userState, conversationState) {
        super(ADMIN_DIALOG);
        this.conversationState = conversationState;
        this.userState = userState;

        this.addDialog(new ChoicePrompt(CHOICE_PROMPT))
        this.addDialog(new TextPrompt(TEXT_PROMPT))
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.adminIntroStep.bind(this),
            this.adminActStep.bind(this),
            this.adminConfirmStep.bind(this),
            this.adminFinalStep.bind(this)

        ]));
        
        this.initialDialogId = WATERFALL_DIALOG;
        
    }

    async adminIntroStep(stepContext) {
        return await stepContext.prompt(CHOICE_PROMPT, {
            prompt:'Here are some options you can try', 
            choices: ChoiceFactory.toChoices(['Stationery', 'Furniture', 'Electronics', 'Request Status'])
        });      
        }

    
    async adminActStep(stepContext) {
        
        switch (stepContext.result.value) {
        case 'Stationery': {
            return await stepContext.prompt(CHOICE_PROMPT, {
                prompt:'Some available options are :', 
                choices: ChoiceFactory.toChoices(['Notebook', 'Pen', 'Marker'])
            });
                 
        }

        case 'Furniture': {
            return await stepContext.prompt(CHOICE_PROMPT, {
                prompt:'Some available options are :', 
                choices: ChoiceFactory.toChoices(['Chair', 'Table', 'Drawer'])
            });
                 
        }

        case 'Electronics': {
            return await stepContext.prompt(CHOICE_PROMPT, {
                prompt:'Some available options are :', 
                choices: ChoiceFactory.toChoices(['AC', 'Fan', 'Bulb', 'Tubelight'])
            });
                 
        }
        
        default: {
            return await stepContext.endDialog();
        }
        }
    }
        
    

    async adminConfirmStep(stepContext) {
        return await stepContext.prompt(CHOICE_PROMPT, {
            prompt:`Your ${stepContext.result.value} request will be sent to Admin. Do you want to continue ?`, 
            choices: ChoiceFactory.toChoices(['Yes', 'No'])
        });
        
    }

    async adminFinalStep(stepContext) {
        if (stepContext.result.value=="Yes"){
            await stepContext.context.sendActivity(`Your request has been successfully sent. Admin will contact you soon !`);
            return await stepContext.endDialog();
        }else{
            await stepContext.context.sendActivity(`It's Ok ! How may i assist you further ?`);
            return await stepContext.replaceDialog(this.initialDialogId, { restartMsg: 'What else can I do for you?' });
        }
        
    }

    
}

module.exports.adminDialog = adminDialog;
module.exports.ADMIN_DIALOG = ADMIN_DIALOG;