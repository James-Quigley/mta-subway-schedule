const Alexa = require('ask-sdk-core');
const AWS = require('aws-sdk');

const ddb = new AWS.DynamoDB.DocumentClient();

const getSchedule = async (id) => {
    const params = {
        Key: {
            id
        },
        TableName: process.env.DYNAMO_TABLE_NAME
    }
    const { Item } = await ddb.get(params).promise();
    console.log(Item.schedule);
    return Item.schedule;
}

const getResponseText = (trains, direction) => {
    let speechText;
    if (trains.length > 1) {
        speechText = `There is a ${direction} bound ${trains[0].routeId} train in ${Math.floor(((trains[0].arrivalTime * 1000) - Date.now()) / 1000 / 60)} minutes and a ${trains[1].routeId} train in ${Math.floor(((trains[1].arrivalTime * 1000) - Date.now()) / 1000 / 60)} minutes`;
    } else if (trains.length == 1) {
        speechText = `There is a ${direction} bound ${trains[0].routeId} train in ${Math.floor(((trains[0].arrivalTime * 1000) - Date.now()) / 1000 / 60)} minutes`;
    } else {
        speechText = `There are no upcoming ${direction} bound trains`;
    }
    return speechText;
}


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

        const schedule = await getSchedule('Broadway');

        let futureSTrains = schedule.S.filter(train => train.arrivalTime * 1000 > Date.now());

        const speechText = getResponseText(futureSTrains, "Manhattan");

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

        const schedule = await getSchedule('Broadway');
        let futureNTrains = schedule.N.filter(train => train.arrivalTime * 1000 > Date.now());

        const speechText = getResponseText(futureNTrains, "Queens");

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
