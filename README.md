# Fire Plan Alexa Lambda

The is the entry poing for the Fire Action Plan Alexa Skill. The repository contains the main AWS Lambda function.
Improtant: this is a backend function only, the actual Alexa skill has to be built manually through Developer portal: [https://https://developer.amazon.com]

In short, the process looks like this:
1. Login and press "Create Skill" -> select from scratch option
2. For the Skill Invocation Name type "fire action plan"
3. For the Intents section create the structure using the following json:
~~~
{
    "interactionModel": {
        "languageModel": {
            "invocationName": "fire action plan",
            "intents": [
                {
                    "name": "AMAZON.FallbackIntent",
                    "samples": []
                },
                {
                    "name": "AMAZON.CancelIntent",
                    "samples": []
                },
                {
                    "name": "AMAZON.HelpIntent",
                    "samples": []
                },
                {
                    "name": "AMAZON.StopIntent",
                    "samples": []
                },
                {
                    "name": "AMAZON.NavigateHomeIntent",
                    "samples": []
                },
                {
                    "name": "SetupIntent",
                    "slots": [],
                    "samples": [
                        "setup"
                    ]
                },
                {
                    "name": "WantPlanIntent",
                    "slots": [
                        {
                            "name": "continue",
                            "type": "yesNoType"
                        },
                        {
                            "name": "count",
                            "type": "AMAZON.NUMBER"
                        }
                    ],
                    "samples": [
                        "{continue}"
                    ]
                }
            ],
            "types": [
                {
                    "name": "yesNoType",
                    "values": [
                        {
                            "id": "false",
                            "name": {
                                "value": "no",
                                "synonyms": [
                                    "of course",
                                    "you know it",
                                    "yes I do",
                                    "yes please",
                                    "yeap"
                                ]
                            }
                        },
                        {
                            "id": "true",
                            "name": {
                                "value": "yes",
                                "synonyms": [
                                    "I do not",
                                    "nope",
                                    "no thank you"
                                ]
                            }
                        }
                    ]
                }
            ]
        },
        "dialog": {
            "intents": [
                {
                    "name": "WantPlanIntent",
                    "confirmationRequired": false,
                    "prompts": {},
                    "slots": [
                        {
                            "name": "continue",
                            "type": "yesNoType",
                            "confirmationRequired": false,
                            "elicitationRequired": true,
                            "prompts": {
                                "elicitation": "Elicit.Slot.1342226597358.633173733043"
                            }
                        },
                        {
                            "name": "count",
                            "type": "AMAZON.NUMBER",
                            "confirmationRequired": false,
                            "elicitationRequired": false,
                            "prompts": {}
                        }
                    ]
                }
            ],
            "delegationStrategy": "ALWAYS"
        },
        "prompts": [
            {
                "id": "Elicit.Slot.1342226597358.633173733043",
                "variations": [
                    {
                        "type": "PlainText",
                        "value": "Can you please say that again?"
                    },
                    {
                        "type": "PlainText",
                        "value": "I'm sorry I did not understand that."
                    }
                ]
            }
        ]
    }
}
~~~

Once the setup is done, Lambda function can be deployed.

## Deployment
You will need AWS Account, a user account with admin role and the following params in your environment:
~~~bash
export AWS_REGION=us-west-2
export aws_access_key_id=......
aws_secret_access_key=...
~~~
1. Login to your AWS account and create a Lambda function with Python runtime, leave the code empty.
2. Go to the location of the project and type: 
~~~bash
zip -r lambda.zip ./*
aws lambda update-function-code --function-name <your_function_name> --zip-file fileb://lambda.zip
~~~
3. The function should contain your code now.
4. Go back to your Alexa Skill and under "Endpoint" section, paste ARN for your lambda.

## Dependant resource

* [Fire Plan Api Parser Lambda](https://github.com/AnthonyGDoueihi/fire_plan_api_parser)

Made durint the NASA Space Apps 2019 Hackathon. Need help improving the flow of this.

## Built With 

* [Alexa](https://developer.amazon.com/documentation/)
* [Lambda](https://docs.aws.amazon.com/lambda/index.html)
* [DynamoDB](https://docs.aws.amazon.com/dynamodb/)
* [Open Cage Api](https://opencagedata.com/api)

## TODO List
- Get Alexa Reminders working
- 
