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

you'll need (this)[https://discord.com/api/oauth2/authorize?client_id={INSERT_BOT_ID_HERE}&permissions=2147494980&scope=applications.commands%20bot] link to invite the bot to your server

## how to use

#### /emulateban <user> <type> <reason>

for testing purposes

#### /addglobalcheck <type> <expression>

for adding a global check expression.
types available are: regex, exact, contains
**the contains type will ban/request to ban any username with the contained string, please be cautious**

#### /setusercheck <user> <expression>

for setting a user specific regex expression, useful so the global expressions don't get cluttered
