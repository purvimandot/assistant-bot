// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { LuisRecognizer } = require('botbuilder-ai');
const { InputHints, MessageFactory, CardFactory} = require('botbuilder');
const { ConfirmPrompt, TextPrompt, WaterfallDialog, ComponentDialog, ChoiceFactory, ChoicePrompt } = require('botbuilder-dialogs');


const TEXT_PROMPT = 'textPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';
const SALES_DIALOG = 'salesDialog';
const CHOICE_PROMPT = 'CHOICE_PROMPT';


class salesDialog extends ComponentDialog {
    constructor(userState, conversationState, luisRecognizer) {
        super(SALES_DIALOG);     
        this.userState = userState;
        this.conversationState = conversationState;
        this.luisRecognizer = luisRecognizer;

        this.addDialog(new ChoicePrompt(CHOICE_PROMPT))
        this.addDialog(new TextPrompt(TEXT_PROMPT))
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.SALESintroStep.bind(this),
            this.SALESactStep.bind(this),
            this.SALESfinalStep.bind(this),
        ]));
        this.initialDialogId = WATERFALL_DIALOG;
        
    }

    async SALESintroStep(stepContext) {
        return await stepContext.prompt(CHOICE_PROMPT, {
            prompt:'Here are a few suggestions you can try', 
            choices: ChoiceFactory.toChoices(['Target','Create Opportunity','Achieved'])
        });      
    }

    
    async SALESactStep(stepContext) {    
        switch (stepContext.result.value) {
            case 'Target': {
                return await stepContext.prompt(CHOICE_PROMPT, {
                    prompt:'Please select the account', 
                    choices: ChoiceFactory.toChoices(['Contoso Retail'])
                });           
            }

            case 'CreateOpportunity': {
                return await stepContext.prompt(CHOICE_PROMPT, {
                    prompt:'Please select the account', 
                    choices: ChoiceFactory.toChoices(['Contoso Retail'])
                });           
            }

            case 'Achieved': {
                return await stepContext.prompt(CHOICE_PROMPT, {
                    prompt:'Please select the account', 
                    choices: ChoiceFactory.toChoices(['Contoso Retail'])
                });           
            }

        }
        
        return await stepContext.replaceDialog(this.initialDialogId, { restartMsg: 'What else can I do for you?' }); 
    }

    async SALESfinalStep(stepContext) {
        return await stepContext.prompt(TEXT_PROMPT,"Sorry not able to connect plz try later");    
    }

    

    
    
}

module.exports.salesDialog = salesDialog;
module.exports.SALES_DIALOG = SALES_DIALOG;