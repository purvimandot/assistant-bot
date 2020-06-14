// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { LuisRecognizer } = require('botbuilder-ai');
const { InputHints, MessageFactory, CardFactory} = require('botbuilder');
const { ConfirmPrompt, TextPrompt, WaterfallDialog, ComponentDialog, ChoiceFactory, ChoicePrompt } = require('botbuilder-dialogs');
const holidayCard = require('./resources/holiday.json');
const referalCard = require('./resources/referalPolicy.json');

const TEXT_PROMPT = 'textPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';
const HR_DIALOG = 'hrDialog';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
const LEAVE_DETAILS = 'leaveDetails';


class hrDialog extends ComponentDialog {
    constructor(userState, conversationState, luisRecognizer) {
        super(HR_DIALOG);
        this.leaveDetailsAccessor = userState.createProperty(LEAVE_DETAILS);
        
        this.userState = userState;
        this.conversationState = conversationState;
        this.luisRecognizer = luisRecognizer;

        this.addDialog(new ChoicePrompt(CHOICE_PROMPT))
        this.addDialog(new TextPrompt(TEXT_PROMPT))
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.HRintroStep.bind(this),
            this.HRactStep.bind(this),
        ]));
        this.addDialog(new WaterfallDialog('actStep', [
            this.HRactStep.bind(this),
        ]));
        
        
        this.addDialog(new WaterfallDialog('survey', [
            this.leaveDateStep.bind(this),
            this.leaveConfirm.bind(this),
            this.probStep.bind(this),
            this.probTypeStep.bind(this),
            this.probDesSum.bind(this)

        ]));

        this.addDialog(new WaterfallDialog('refer', [
            this.posStep.bind(this),
            this.resumeStep.bind(this),
            this.referSummary.bind(this)

        ]));

        this.initialDialogId = WATERFALL_DIALOG;
        
    }

    async HRintroStep(stepContext) {
        return await stepContext.prompt(CHOICE_PROMPT, {
            prompt:'Here are a few suggestions you can try', 
            choices: ChoiceFactory.toChoices(['Leave Management','Payroll','Recruitment', 'Survey','Holiday Calendar','Help'])
        });      
    }

    
    async HRactStep(stepContext) {
        console.log("hractStep");
        if (this.luisRecognizer.isConfigured) {
            console.log("hractStep insides")  
            const luisResult = await this.luisRecognizer.executeLuisQuery(stepContext.context);
            switch (LuisRecognizer.topIntent(luisResult)) {
                case 'LeaveManagement': {
                    return await stepContext.prompt(CHOICE_PROMPT, {
                        prompt:'Sure I can assist you with leave management', 
                        choices: ChoiceFactory.toChoices(['RequestLeave', 'Leave Balance', 'Delete Leave Application'])
                    });           
                }

                case 'RequestLeave': {
                    
                    var levreq = 'Plz write "i want 2 days sick leave"'
                    await stepContext.prompt(TEXT_PROMPT,levreq);
                    const leaveDetails = await this.leaveDetailsAccessor.get(stepContext.context, {});
                    leaveDetails.application = stepContext.context.activity.text;
                    leaveDetails.leaveType = this.luisRecognizer.getLeaveType(luisResult);
                    leaveDetails.leaveDays = this.luisRecognizer.getLeaveDays(luisResult);
                    leaveDetails.balance = 100 - leaveDetails.leaveDays;
                    
                    if(leaveDetails.leaveType && leaveDetails.leaveDays ){
                        console.log('LUIS extracted these booking details:', JSON.stringify(leaveDetails));
                        await stepContext.context.sendActivity(`Leave Application Applied \nLeave Type - ${leaveDetails.leaveType}\nLeave Days - ${leaveDetails.leaveDays}`);
                        return await stepContext.endDialog();
                    } else{
                        return stepContext.replaceDialog('actStep');
                    }
                }

                case 'DeleteLeave': {
                    let leaveDetails = await this.leaveDetailsAccessor.get(stepContext.context, {});
                    if(leaveDetails){
                        await stepContext.context.sendActivity("Deleting your leave Application");
                        leaveDetails = {}
                        return await stepContext.endDialog();
                    }else{
                        await stepContext.context.sendActivity("You dont have any application pending!! ");
                        return await stepContext.replaceDialog(this.initialDialogId, { restartMsg: 'What else can I do for you?' });
                    }
                    
                }

                case 'LeaveBalance': {
                    let leaveDetails = await this.leaveDetailsAccessor.get(stepContext.context, {});
                    if(leaveDetails.balance){
                        await stepContext.context.sendActivity(`Your leave balance is ${leaveDetails.balance}`);
                        return await stepContext.endDialog();
                    }else{
                        await stepContext.context.sendActivity(`Your leave balance is 100`);
                        return await stepContext.endDialog();
                    }
                    
                }

                case 'ReferralPolicy': {
                    await stepContext.context.sendActivity({
                        attachments: [CardFactory.adaptiveCard(referalCard)]
                    });
                    return await stepContext.endDialog();
                }

                case 'Refer': {                    
                    return stepContext.replaceDialog('refer');
                }

                case 'Payroll': {
                
                    const salesText = 'TODO:';
                    await stepContext.context.sendActivity(salesText);
                    break;
                }

                case 'Recruitment': {
                    
                    return await stepContext.prompt(CHOICE_PROMPT, {
                        prompt:'Here are a few options to choose from', 
                        choices: ChoiceFactory.toChoices(['Refer a Candidate', 'Referral Policy', 'Help'])
                    }); 
                }

                case 'L&D': {
                    
                    return await stepContext.prompt(CHOICE_PROMPT, {
                        prompt:'Here are a few options to choose from', 
                        choices: ChoiceFactory.toChoices(['My Portfolio ', 'Training', 'Add Certificates','Add skills'])
                    }); 
                }

                case 'Survey': {
                    
                    return stepContext.replaceDialog('survey');
                }

                case 'HolidayCalendar': {
                    await stepContext.context.sendActivity("Your Holiday Calendar");
                    await stepContext.context.sendActivity({
                        attachments: [CardFactory.adaptiveCard(holidayCard)]
                    });
                    return await stepContext.endDialog();
                }

                case 'Help': {
                    return await stepContext.replaceDialog(this.initialDialogId, { restartMsg: 'What else can I do for you?' });
                }

                default: {
                    // Catch all for unhandled intents
                    const didntUnderstandMessageText = `Sorry, I didn't get that. Please try asking in a different way (intent was ${ LuisRecognizer.topIntent(luisResult) })`;
                    return await stepContext.endDialog();
                    // await stepContext.context.sendActivity(didntUnderstandMessageText, didntUnderstandMessageText, InputHints.IgnoringInput);
                }
                
            }
        }
        return await stepContext.replaceDialog(this.initialDialogId, { restartMsg: 'What else can I do for you?' }); 
    }

    

    async leaveDateStep(stepContext) {
        return await stepContext.prompt(TEXT_PROMPT,"Enter the time of your last leave.");  
    } 

    async leaveConfirm(stepContext) {
        return await stepContext.prompt(CHOICE_PROMPT, {
            prompt:'Did your manager approve it.', 
            choices: ChoiceFactory.toChoices(['YES', 'NO'])
        });      
    }

    async probStep(stepContext) {
        return await stepContext.prompt(CHOICE_PROMPT, {
            prompt:'Are you facing any other problem?', 
            choices: ChoiceFactory.toChoices(['YES', 'NO'])
        });      
    }
    
    async probTypeStep(stepContext) {
        if(stepContext.result.value=='YES'){        
            return await stepContext.prompt(CHOICE_PROMPT, {
                prompt:'What type of problem are you facing?', 
                choices: ChoiceFactory.toChoices(['Salary Issue', 'Work Load Issue', 'Communication Issue', 'Facilities Issue', 'Misc Issue'])
            });
        }else{
            await stepContext.context.sendActivity(`Your Feedback has been successfully submitted.`);
            return await stepContext.endDialog();
        }
    }    

    
    async probDesSum(stepContext) {
        await stepContext.prompt(TEXT_PROMPT,`Plz describe your problem related to ${stepContext.result.value}`);  
        await stepContext.context.sendActivity(`Your Feedback has been successfully submitted.`);
        return await stepContext.endDialog();
    }



    async posStep(stepContext) {
        return await stepContext.prompt(CHOICE_PROMPT, {
            prompt:'Select a Position', 
            choices: ChoiceFactory.toChoices(['Python Programmer', 'JAVA Programmer', 'Chatbot Developer', 'Azure Developer'])
        });      
    }
    
    async resumeStep(stepContext) {
        return await stepContext.prompt(TEXT_PROMPT,"Enter Resume URL");  
    }    
    
    async referSummary(stepContext) {
        await stepContext.context.sendActivity(`Your referral has been successfully submitted.`);
        return await stepContext.endDialog();
    }
    
}

module.exports.hrDialog = hrDialog;
module.exports.HR_DIALOG = HR_DIALOG;