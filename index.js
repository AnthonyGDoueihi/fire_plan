/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk-core');
const AWS = require("aws-sdk");
const { DynamoDbPersistenceAdapter } = require('ask-sdk-dynamodb-persistence-adapter');

const PERMISSIONS = ['read::alexa:device:all:address', 'alexa::alerts:reminders:skill:readwrite'];
let count = 0;

const ReminderRequestHandler = {
  canHandle(handlerInput){
    // const request = handlerInput.requestEnvelope.request;
    // return request.type === 'LaunchRequest';
    return (handlerInput.requestEnvelope.request.type === 'ReminderRequest');
  },
  async handle(handlerInput){
    const requestEnvelope = handlerInput.requestEnvelope;
    const responseBuilder = handlerInput.responseBuilder;
    const consentToken = requestEnvelope.context.System.apiAccessToken;

    if (!consentToken) {
      return responseBuilder
        .speak("We need permission to send you a warning.")
        .withAskForPermissionsConsentCard(PERMISSIONS)
        .getResponse();
    }
    
    try {

      console.log(handlerInput.serviceClientFactory);
      const client = handlerInput.serviceClientFactory.getReminderManagementServiceClient();

      const reminderRequest = {
        trigger: {
          type: 'SCHEDULED_RELATIVE',
          offsetInSeconds: '30',
        },
        alertInfo: {
          spokenInfo: {
            content: [{
              locale: 'en-US',
              text: 'time to get up and dance',
            }],
          },
        },
        pushNotification: {
          status: 'ENABLED',
        },
      };
      const reminderResponse = await client.createReminder(reminderRequest);
      console.log(JSON.stringify(reminderResponse));
    } catch (error) {
      if (error.name !== 'ServiceError') {
        console.log(`error: ${error.stack}`);
        const response = responseBuilder.speak("There is an error here").getResponse();
        return response;
      }
      throw error;
    }

    return responseBuilder
      .speak("We created a reminder")
      .getResponse();
  }
};

const HasAddressLaunchRequestHandler = {
  async canHandle(handlerInput){
    const attributesManager = handlerInput.attributesManager;

    const sessionAttributes = await attributesManager.getPersistentAttributes();

    const exists = sessionAttributes.hasOwnProperty('is_red') ? true : false;
    return (handlerInput.requestEnvelope.request.type === 'LaunchRequest') && exists;
  },
  async handle(handlerInput){
    const requestEnvelope = handlerInput.requestEnvelope;
    const responseBuilder = handlerInput.responseBuilder;
    const attributesManager = handlerInput.attributesManager;
    const sessionAttributes = await attributesManager.getPersistentAttributes();
    const { is_red, is_orange } = sessionAttributes;
    count ++;
    if (is_red) {
      return responseBuilder
        .speak(message.hasAddressRed)
        .reprompt(message.hasAddressRed)
        .getResponse();
    }else if (is_orange){
      return responseBuilder
        .speak(message.hasAddressYellow)
        .reprompt(message.hasAddressYellow)
        .getResponse();
    }else{
      console.log(message.hasAddressGreen)
      return responseBuilder
        .speak(message.hasAddressGreen)
        .reprompt(message.hasAddressGreen)
        .getResponse();
    }
  }
};

const LaunchRequestHandler = {
  canHandle(handlerInput){
      const request = handlerInput.requestEnvelope.request;
      return request.type === 'LaunchRequest';
  },
  async handle(handlerInput){
    const consentToken = handlerInput.requestEnvelope.context.System.apiAccessToken;
    if (!consentToken) {
      return handlerInput.responseBuilder
        .speak('Please enable Location permissions in the Amazon Alexa app.')
        .withAskForPermissionsConsentCard(PERMISSIONS)
        .getResponse();
    }
    try {
    
      const deviceId = handlerInput.requestEnvelope.context.System.device.deviceId;
    
      const deviceAddressServiceClient = handlerInput.serviceClientFactory.getDeviceAddressServiceClient();
      const address = await deviceAddressServiceClient.getFullAddress(deviceId);
      // const address = { addressLine1: '100 Harris st', addressLine2: null, addressLine3: null, city: 'Pyrmont', stateOrRegion: 'NSW', districtOrCounty: null, countryCode: 'AU', postalCode: '2009' };
          
      console.log('Address successfully retrieved, now responding to user.');
      
      let response;
      if (address.addressLine1 === null && address.districtOrCounty === null) {
        response = handlerInput.responseBuilder.speak("There is no Address").getResponse();
      } else {
        
        const ADDRESS_MESSAGE = `"We found this address"`;
        // ${address.addressLine1}, ${address.stateOrRegion}, ${address.postalCode}`;
        response = handlerInput.responseBuilder.speak(ADDRESS_MESSAGE)  
        .withShouldEndSession(true)
        .getResponse();
        
        const userAttributes = {
          "is_orange": false,
          "is_red": false,
          "address": address
        };
        const attributesManager = handlerInput.attributesManager;
        attributesManager.setPersistentAttributes(userAttributes);
        await attributesManager.savePersistentAttributes();
      }
      

      
      return response;
    }catch (error){
      if (error.name !== 'ServiceError') {
        const response = handlerInput.responseBuilder.speak('There was an error with the Device Address API. Please check the logs.')
        .withShouldEndSession(true)
        .getResponse();
        return response;
      }
      throw error;
    }
  },
};

const WantPlanIntentHandler = {
  canHandle(handlerInput) {
    const requestEnvelope = handlerInput.requestEnvelope;
    const shouldContinue = requestEnvelope.request.intent.slots.continue.resolutions.resolutionsPerAuthority[0].values[0].value.id;
    console.log('is this passing twice', count)
    return requestEnvelope.request.type === 'IntentRequest' &&
      requestEnvelope.request.intent.name === 'WantPlanIntent' && 
      shouldContinue === 'true';
  },
  async handle(handlerInput) {
    const requestEnvelope = handlerInput.requestEnvelope;
    const responseBuilder = handlerInput.responseBuilder;
    const attributesManager = handlerInput.attributesManager;

    const sessionAttributes = await attributesManager.getPersistentAttributes();
    console.log(sessionAttributes.hasOwnProperty('is_red'), )
    if (!sessionAttributes.hasOwnProperty('is_red') || !sessionAttributes.hasOwnProperty('is_orange')){
      return responseBuilder
        .speak("An error occured in the database, please check other sources for your risk of fire and report this issue.")
        .withShouldEndSession(true)
        .getResponse();
    }

    const { is_red, is_orange } = sessionAttributes;
    // const count = requestEnvelope.request.intent.slots.count.value;
    if (is_red){
      if (count === 1){
        count = 0;
        return responseBuilder
          .speak(message.adviceRed1)
          .withShouldEndSession(true)
          .getResponse();
      }
    }else if (is_orange){
      if (count === 1) {
        count ++;
        return responseBuilder
          .speak(message.adviceYellow1)
          .reprompt('Would you like to hear more advice?')
          .getResponse();
      } else if (count === 2) {
        count ++;
        return responseBuilder
          .speak(message.adviceYellow2)
          .reprompt('Would you like to hear more advice?')
          .getResponse();
      }
      else if (count === 3) {
        count = 0;
        return responseBuilder
          .speak(message.adviceYellow3)
          .withShouldEndSession(true)
          .getResponse();
      }
    }else{
      if (count === 1) {
        count ++;
        return responseBuilder
          .speak(message.adviceGreen1)
          .reprompt('Would you like to hear more advice?')
          .getResponse();
      } else if (count === 2) {    
        count ++;
        return responseBuilder
          .speak(message.adviceGreen2)
          .reprompt('Would you like to hear more advice?')
          .getResponse();
      }
      else if (count === 3) {
        count = 0;
        return responseBuilder
          .speak(message.adviceGreen3)
          .withShouldEndSession(true)
          .getResponse();
      }
    }
  }
}

const DontWantPlanIntentHandler = {
    canHandle(handlerInput) {
    console.log('am I here?')
    const requestEnvelope = handlerInput.requestEnvelope;
    const shouldContinue = requestEnvelope.request.intent.slots.continue.resolutions.resolutionsPerAuthority[0].values[0].value.id;
    console.log('shouldContinue')
    return requestEnvelope.request.type === 'IntentRequest' &&
      requestEnvelope.request.intent.name === 'WantPlanIntent' && 
      shouldContinue === 'false';
  },
  handle(handlerInput) {
    const requestEnvelope = handlerInput.requestEnvelope;
    const responseBuilder = handlerInput.responseBuilder;

    return responseBuilder
      .speak("Okay then. Ask me again if you need anything else.")
      .withShouldEndSession(true)
      .getResponse();
  }
}

const SetupIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return (request.type === 'IntentRequest'
        && request.intent.name === 'SetupIntent');
  },
  handle(handlerInput) {
    const speechOutput = 'Setup has been called';

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .getResponse();
  },
};

const HelpHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(HELP_MESSAGE)
      .reprompt(HELP_REPROMPT)
      .getResponse();
  },
};

const ExitHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && (request.intent.name === 'AMAZON.CancelIntent'
        || request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(STOP_MESSAGE)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.withShouldEndSession(true).getResponse();
  },
};

const HELP_MESSAGE = 'You can say tell me a space fact, or, you can say exit... What can I help you with?';
const HELP_REPROMPT = 'What can I help you with?';
const STOP_MESSAGE = 'Goodbye!';

const message = {
  hasAddressRed:`
               Your fire risk is high. 
               Any delay now will put your survival at risk. 
               Would you like to activate your Fire Plan?
             `,
  adviceRed1:`
                I sent a message to your nominated contacts.
                I sent the bushfire safety location to your phone.
                Remember to collect your items, and go to your bushfire saftey location.
                Any delay now will put your survival at risk
             `      ,
  hasAddressYellow:`
                Your fire risk is medium
                (We recommend that you prepare leave early)
                Would you like to activate your Fire Plan?
             `,
  adviceYellow1:`
                1) I sent a message to your nominated contacts.
                2) Take your X, Y and Z...
                3) I sent the bushfire safety location to your phone. (We recommend that you prepare leave early)
                Would you like advice on how to prepare for a fire?
             `,
  adviceYellow2:`
                Here is advice on how to prepare for a fire 
                (3 pieces of advice given)
                Would you like to hear more advice?
             `,
  adviceYellow3:`
                Remember to collect your items, 
                and go to your bushfire saftey location soon
             `,
  hasAddressGreen:`
               Your fire risk is low. 
               Would you like some advice on how to prepare for a fire?
             `,
  adviceGreen1:`
               Here is some advice on how to prepare for a fire
               (3 pieces of advice given)
               Would you like to hear more advice?
              `,
  adviceGreen2: `
               (3 pieces of advice given)
               Would you like to hear more advice?
              `,
  adviceGreen3: `
               (3 pieces of advice given)
               Would you like to hear more advice?
              `,
  // TODO adviceGreen all the way as advice as we have to give
  setupcontinue:`
                Is {place} correct?
              `,
  setupIntro:`
                In your fire plan, you have to inform where do you want to go, 
                what to take and who to inform in case of an emergency. 
              `,
  setupPlace1:`
                Where is your bushfire safety location?
              `,
  setupPlace2:`
                Would you like to add another bushfire safety location?
              `,
  setupItems1:`
                What will you take with you?
              `,
  setupItems2:`
                What else would you like to take with you?
              `,
  setupContacts1:`
                Who do you need to inform?
              `,
  setupContactsNumber:`
                What is their number?
              `,
  setupContacts2:`
                Who else do you need to inform?
              `,
  setupAuthorisingCheck:`
                Fire plan sends you alerts of bushfire risks in a radius of 300 meters within (x location). Do you authorize the Fire Plan to send you notifications?
              `,
  setupComplete:`
              Your fire plan is set! Talk to me again if you want to hear some advice.
            `  
}

const skillBuilder = Alexa.SkillBuilders.custom();
const dynamoDbPersistenceAdapter = new DynamoDbPersistenceAdapter({ tableName : 'FireActionUser' });

exports.handler = skillBuilder
  .addRequestHandlers(
    ReminderRequestHandler,
    HasAddressLaunchRequestHandler,
    LaunchRequestHandler,
    WantPlanIntentHandler,
    DontWantPlanIntentHandler,
    SetupIntentHandler,
    HelpHandler,
    ExitHandler,
    SessionEndedRequestHandler
  )
  .withPersistenceAdapter(dynamoDbPersistenceAdapter)
  .withApiClient(new Alexa.DefaultApiClient())
  .withCustomUserAgent('cookbook/reminders/v1')
  .withSkillId('amzn1.ask.skill.8a5d9b98-fc4a-4fb6-b36c-3eb0f2d5cf21')
  .lambda();
