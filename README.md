# brave-ai

This repository is for the code needed to complete the AI Devs 2 course (aidevs.pl)

Currently it offers one command for solving different tasks adviced in that course.

## Setup
- clone the repo
- `yarn`
- `cp .env.example .env`
- fill in the `.env` file with API keys


## Usage

`yarn run main solve thetaskname`

It makes the following steps:
- authenticate at https://zadania.aidevs.pl/token/taskname to get the token for personalized task endpoints
- gets the task from personalized task endpoint, using the obtained token
- uses one of the predefined solutions or calls OpenAI API for figuring out a solution
- sends the answer back to aidevs.pl/answer/\[token]
