# ban impersonators

## how to run (bash)

```bash
cp examples/config.example.json config.json
# edit the config.json file to have your ids/token in it
```

```bash
node deploy-commands.js
```

```bash
node index
```

you'll need [this](https://discord.com/api/oauth2/authorize?client_id={INSERT_BOT_ID_HERE}&permissions=2147494980&scope=applications.commands%20bot) link to invite the bot to your server

## how to use

#### global

##### `/global add <type> <expression>`

for adding a global check
types available are: regex, exact, contains  
**the contains type will ban/request to ban any username with the contained string, please be cautious**

##### `/global remove <index>`

for removing a global check. index can be found with the list command

##### `/global list [page]`

for listing global checks and their corresponding index and type

#### user

##### `/user set <user> <expression>`

for setting a user check. if you don't have an expression, use the add command

##### `/user remove <user>`

for removing a user check

##### `/user add <user>`

for adding a user check

##### `/user list [page]`

for listing users and their corresponding regex check

#### other

##### `/refresh`

refreshes the permissions for the provided role ids in the config.

##### `/normalise <string>`

normalises a string so it can be used in regex

##### `/emulate <user> <type> [reason]`

emulates a ban. used for testing.

##### `/bulkban <type> <starttime/startuser> <endtime/enduser>`

bulkbans users that joined between a certain time period

##### `/clear`

clears all prompts in the prompts channel

##### `/sweep`

manually runs a sweep of all guild members to match expressions

## config

```JSON
{
    "token": "INSERT_TOKEN_HERE", // discord bot token
    "guildId": "INSERT_GUILD_ID_HERE", // discord guild id
    "clientId": "INSERT_CLIENT_ID_HERE", // discord bot client id
    "channelIds": {
        "logs": "INSERT_LOG_CHANNEL_ID_HERE", // log channel id
        "prompts": "INSERT_PROMPT_CHANNEL_ID_HERE" // prompts channel id
    },
    "permittedRoleIds": ["INSERT_PERMITTED_ROLE_IDS_HERE"], // roles permitted to use application commands
    "autoSweepTime": 5, // interval between each automatic sweep (in minutes)
    "banConfirmations": { // bools for if a event requires a prompt before banning (true = prompt required)
        "onJoin": { // user join event
            "recentDuplicate": true, // user with same username joined in last 100 users
            "importantUserRegex": true, // important user expression match
            "globalRegex": true // global expression match
        },
        "usernameChange": { // user username change event
            "fastChange": true, // user quickly changed username more than 1 time
            "importantUserRegex": true, // important user expression match
            "globalRegex": true // global expression match
        },
        "manualSweep": { // manual member sweep event
            "importantUserRegex": true, // important user expression match
            "globalRegex": true // global expression match
        }
    }
}
```
