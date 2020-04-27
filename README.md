# Where Am I?

> A game where you're dropped randomly around the world in Google Street View and you need to figure out where you are.

*Note:* This project doesn't include anything to actually serve the game. I'll leave that up to you all to choose how best to serve the game.

## Running it Yourself

### Getting an API Key

You'll need to head over to [Google](https://developers.google.com/maps/documentation/javascript/get-api-key) to get an API key for the Javascript Maps API.

Once you've got your API key, drop that in `app/auth.js`.

```js
// app/auth.js
module.exports = 'YOUR_API_KEY';
```

### Building the Thing

_Where Am I_ uses gulp to generate the javascript bundle and compile the styles, so you'll need to install node modules and build the game.

```
npm install
npm run build
```

This will create a `dist` directory with the compiled game that can be served using any choice of web servers.

#### Rebuilding During Development

You can also rebuild the complete app on file changes if you're wanting to make any changes.

```
npm run watch
```


