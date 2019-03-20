/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk-core');
var AWS = require('aws-sdk'),
region = "us-east-1",
secretName = "MTA_API_KEY";

var client = new AWS.SecretsManager({
  region: region
});

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speechText = 'You can ask about Manhattan or Queens bound trains';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('Broadway N/W', speechText)
      .getResponse();
  },
};

const SouthIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'SouthIntent';
  },
  async handle(handlerInput) {

    let data = await (client.getSecretValue({SecretId: secretName}).promise());
    let secret = data.SecretString;

    var Mta = require('mta-gtfs');
    var mta = new Mta({
      key: JSON.parse(secret).API_KEY, // only needed for mta.schedule() method
      feed_id: 16                  // optional, default = 1
    });

    let schedule = await mta.schedule('R05');
    let futureSTrains = schedule.schedule.R05.S.filter(train => train.arrivalTime * 1000 > Date.now());
    
    let speechText;
    if (futureSTrains.length > 1){
      speechText = `There is a Manhattan bound ${futureSTrains[0].routeId} train in ${Math.floor(((futureSTrains[0].arrivalTime * 1000) - Date.now())/1000/60)} minutes and a ${futureSTrains[1].routeId} train in ${Math.floor(((futureSTrains[1].arrivalTime * 1000) - Date.now())/1000/60)} minutes`;
    } else if (futureSTrains.length == 1){
      speechText = `There is a Manhattan bound ${futureSTrains[0].routeId} train in ${Math.floor(((futureSTrains[0].arrivalTime * 1000) - Date.now())/1000/60)} minutes`;
    } else {
      speechText = `There are no upcoming Manhattan bound trains`;
    }
    
    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('Manhattan Trains', speechText)
      .getResponse();
  },
};

const NorthIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'NorthIntent';
  },
  async handle(handlerInput) {

    let data = await (client.getSecretValue({SecretId: secretName}).promise());
    let secret = data.SecretString;

    var Mta = require('mta-gtfs');
    var mta = new Mta({
      key: JSON.parse(secret).API_KEY, // only needed for mta.schedule() method
      feed_id: 16                  // optional, default = 1
    });

    let schedule = await mta.schedule('R05');
    let futureNTrains = schedule.schedule.R05.N.filter(train => train.arrivalTime * 1000 > Date.now());
    
    let speechText;
    if (futureNTrains.length > 1){
      speechText = `There is a Queens bound ${futureNTrains[0].routeId} train in ${Math.floor(((futureNTrains[0].arrivalTime * 1000) - Date.now())/1000/60)} minutes and a ${futureNTrains[1].routeId} train in ${Math.floor(((futureNTrains[1].arrivalTime * 1000) - Date.now())/1000/60)} minutes`;
    } else if (futureNTrains.length == 1){
      speechText = `There is a Queens bound ${futureNTrains[0].routeId} train in ${Math.floor(((futureNTrains[0].arrivalTime * 1000) - Date.now())/1000/60)} minutes`;
    } else {
      speechText = `There are no upcoming Queens bound trains`;
    }
    
    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('Queens Trains', speechText)
      .getResponse();
  },
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speechText = 'You can ask when the next Manhattan or Queens bound trains are!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('How to use', speechText)
      .getResponse();
  },
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speechText = 'Goodbye!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('Subway', speechText)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, I can\'t understand the command. Please say again.')
      .reprompt('Sorry, I can\'t understand the command. Please say again.')
      .getResponse();
  },
};

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    SouthIntentHandler,
    NorthIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
