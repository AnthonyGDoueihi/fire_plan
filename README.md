# Fire Plan Alexa Lambda

The is the entry poing for the Fire Action Plan Alexa Skill. The repository contains the main AWS Lambda function.
Improtant: this is a backend function only, the actual Alexa skill has to be built manually through Developer portal: [https://https://developer.amazon.com]

In short, the process looks like this:
1. Login and press "Create Skill" -> select from scratch option
2. For the Skill Invocation Name type "fire action plan"
3. For the Intents section create the following structure:
  - SetupIntent
  - WantPlanIntent



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
