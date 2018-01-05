const { AuthAPIClient, DataAPIClient } = require("truelayer-client");
const app = require("express")();
var _Token;
const redirect_uri = "http://localhost:5000/truelayer-redirect";

const _sens = require("./Sensitive.js");
// Create TrueLayer client instance
const client = new AuthAPIClient({
    client_id: _sens.ID,
    client_secret: _sens.Secret
});

// Define array of permission scopes
const scopes = ["info", "accounts", "balance", "transactions", "offline_access", "cards"]

// Construct url and redirect to the auth dialog
app.get("/login", (req, res) => {
    const authURL = client.getAuthUrl(redirect_uri, scopes, "foobar");
    res.redirect(authURL);
});

// refresh token if needed
async function refreshToken() {
    const newToken = await client.refreshAccessToken(_Token.refresh_token);
    _Token = newToken;
    console.log("Token refreshed");
}
// validate if token needs to be refreshed
async function isTokenValid() {

    const valid = await DataAPIClient.validateToken(_Token.access_token);
    console.log(valid)
    return valid;
}


// Retrieve 'code' query-string param, exchange it for access token and hit data api
app.get("/truelayer-redirect", async(req, res) => {
    const code = req.query.code;
    const tokens = await client.exchangeCodeForToken(redirect_uri, code);
    _Token = tokens;

    res.redirect("/accounts");
});
//Retrieve accounts
app.get("/accounts", async(req, res) => {

    if (_Token != null) {

        if (await isTokenValid() == true) {
            const accs = await DataAPIClient.getAccounts(_Token.access_token);
            res.send(accs)

        } else {
            await refreshToken();
            const accs = await DataAPIClient.getAccounts(_Token.access_token);
            res.send(accs)
        }
    } else {
        res.redirect("/");
    }
});
//Retrieve single Account by ID
app.get("/accounts/:id", async(req, res) => {

    if (_Token != null) {
        var account_id = req.params.id;
        if (await isTokenValid() == true) {

            const acc = await DataAPIClient.getAccount(_Token.access_token, account_id);
            res.send(acc);
        } else {
            await refreshToken();
            const acc = await DataAPIClient.getAccount(_Token.access_token, account_id);
            res.send(acc);
        }
    } else {
        res.redirect("/");
    }
});

//retrieve balance for given account id
app.get("/balance/:id", async(req, res) => {
    if (_Token != null) {
        var account_id = req.params.id;
        if (await isTokenValid() == true) {

            const balance = await DataAPIClient.getBalance(_Token.access_token, account_id);
            res.send(balance);

        } else {
            await refreshToken();
            const balance = await DataAPIClient.getBalance(_Token.access_token, account_id);
            res.send(balance);

        }
    } else {
        res.redirect("/");
    }
})

app.get("/transactions/:id/:from/:to", async(req, res) => {
        if (_Token != null) {
            var account_id = req.params.id;
            var from = req.params.from;
            var to = req.params.to;

            if (await isTokenValid() == true) {
                const transactions = await DataAPIClient.getTransactions(_Token.access_token, account_id, from, to);
                res.send(transactions);

            } else {
                await refreshToken();
                const transactions = await DataAPIClient.getTransactions(_Token.access_token, account_id, from, to);
                res.send(transactions);

            }
        } else {
            res.redirect("/");
        }
    })
    /// DEV test
app.get("/replacetoken", async(req, res) => {
    _Token.access_token = "xxxxxxxxxxxxxxxxxxxx";
    res.send("Token replaced");
})

app.listen(5000, () => console.log("iSpend-iCry RestAPI listening on port 5000"));