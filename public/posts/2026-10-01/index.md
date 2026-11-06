---
title: How to Add GitHub SSO to Your App (and Run It on Localhost)
date: 2026-10-01
---

For most of my career as a developer, every application I built started the same way.

A signup form. A username. A password. A users table with a password hash column. A "forgot password" flow that I always left for last.

As a backend developer, that was simply how authentication worked. But the more I used modern apps myself, the more limited that experience felt. People do not want to create yet another account for every new tool. They do not want to remember one more password. They want to click **Sign in with Google** or **Sign in with GitHub** and get on with their day.

I had clicked those buttons hundreds of times. I had never built one end to end.

So I decided to build a sample app that would help me understand the core of how SSO really works: how a login is authenticated, how authorization is decided, and what actually happens in the second between clicking the button and landing back in the app.

This post is what I learned along the way.

### The part that surprised me: it works on localhost

My first assumption was that SSO needed a public server. GitHub would have to call my app somehow, right?

It does not.

The whole OAuth redirect happens in your browser. When you click **Sign in with GitHub**, the browser goes to GitHub. You approve the app. GitHub then tells your browser to go back to the callback URL, which can be http://localhost:5173. Your browser follows that redirect to your own machine. GitHub never needs to reach your laptop directly.

That means the demo runs entirely on localhost, and SSO still works. You click the button, approve the app on GitHub, and land right back on your local site, logged in with your own name.

### No signup form, no password

The first time you sign in, the app automatically creates an account for you from your GitHub profile: your name, your login, your avatar, and your verified email. The next time you sign in, it finds the same account and updates it.

There is no signup page. There is no password column in the database. There is nothing for you to remember and nothing for me to leak.

After years of building username and password flows, that was the moment SSO really clicked for me. The identity belongs to GitHub. My app just has to trust it correctly.

### What I built

[github-sso-demo](https://github.com/nishantapatil3/github-sso-demo) is a FastAPI backend and a React UI that use a GitHub OAuth App for login. After you sign in, the dashboard shows everything behind that login, because I did not want a green checkmark. I wanted to understand it.

**Identity.** The full GitHub profile, plus your email addresses and which one is primary and verified.

**Authentication.** The OAuth flow used, the client ID, the redirect URI, whether the security state check passed, the scopes requested versus the scopes granted, and a masked access token. Only the last four characters are ever shown.

**Session.** The decoded session token claims, when the session was issued, when it expires, and a live countdown.

**Authorization.** Your app role and its permissions, plus your GitHub organization memberships, your role in each org, and the teams you belong to.

**Raw JSON.** The entire response, because sometimes you just want to see the data.

There are also two buttons that call a user-only endpoint and an admin-only endpoint. As a normal user, the second one returns a **403**. Add your GitHub login to the admin list in the config, sign in again, and it returns **200**. Seeing authorization fail on purpose is the fastest way to trust that it works.

### Authentication and authorization are different questions

This was the most useful lesson from the whole project.

Authentication answers: **who are you?** GitHub proves that. The app protects the redirect with a random state value stored in a short-lived cookie. If the value coming back from GitHub does not match, the login is rejected.

Authorization answers: **what are you allowed to do?** GitHub does not decide that for my app. My app does. In the demo, a configured list of GitHub logins gets the admin role, and everyone else is a regular user.

GitHub still provides useful signals for authorization, like your org memberships and your role in each one. Those need the read:org scope. If you do not grant it, the dashboard shows "not granted" instead of breaking.

### OAuth, OIDC, and where GitHub fits

I started this project wanting to understand SSO and OIDC, and I learned that they are not the same thing.

**OAuth 2.0** is about access. The app gets a token that lets it call GitHub's API on your behalf, and it learns who you are by asking GitHub for your profile.

**OIDC**, or OpenID Connect, is a layer on top of OAuth that is specifically about identity. Along with the access token, the provider returns a signed ID token that says who you are, which the app can verify on its own. Google and Microsoft sign-in work this way.

GitHub's OAuth Apps use plain OAuth 2.0. There is no ID token, so the demo fetches your profile from the API instead. The flow is almost identical, which makes GitHub a great place to learn the core ideas before moving on to a full OIDC provider.

### The session never touches JavaScript

Once GitHub confirms who you are, the app still needs to remember you between requests.

The easy option is to hand the browser a token and store it in local storage. It works, but any script running on the page can read it.

Instead, the backend signs its own session token and puts it in an **HttpOnly** cookie. The browser sends it automatically, but JavaScript cannot read it. The GitHub access token is used only during login to fetch your profile, emails, orgs, and teams. Then it is thrown away.

### Run it anywhere

The same setup works wherever you deploy it.

On a MacBook, Docker Compose runs the backend and an nginx frontend together on localhost:5173. On a cloud VM or container platform, the exact same images run behind your public domain.

The only thing that changes is the callback URL. GitHub matches it exactly, including the port, so you register the URL of each place you run the app. GitHub OAuth Apps now allow up to 10 redirect URIs, so one app can list both your localhost URL and your cloud URL. Set the app's frontend URL to match, and the redirect takes you right back to your own deployment, whether that is the cloud or the Docker network on your laptop.

### Getting it running

Create an OAuth App in GitHub under Settings, Developer settings, OAuth Apps. For local use, enter these values:

```
Homepage URL:      http://localhost:5173
Callback URL:      http://localhost:5173/auth/github/callback
```

Then clone the repo, add your client ID, client secret, and a random signing secret to the env file, and start it:

```
git clone https://github.com/nishantapatil3/github-sso-demo.git
cd github-sso-demo
cp .env.example .env
docker compose up --build
```

Open localhost:5173 and click **Sign in with GitHub**. Your account is created the moment you land back on the page.

The backend also has tests that fake GitHub's responses, so the full flow can be checked without a real login.

### What it does not do yet

Right now, a session lasts a fixed **8 hours**. There is no refresh, and logout only clears your browser's cookie.

That made me curious about how Google and Facebook keep people signed in for months. They do not use one long token. They pair a long-lived session that the server tracks with short-lived access tokens and rotating refresh tokens. The server can end any session at any time, and sensitive actions still ask you to prove it is you.

That is the next thing I want to add: server-side sessions, sliding expiry, a list of active sessions, and a "log out everywhere" button. It is already on the TODO list in the README.

### Why I am sharing this

I spent years building username and password logins because that was what I knew. SSO felt like something big platforms did, not something I could wire up in an afternoon and run on my own laptop.

It turns out the core ideas are small: a redirect, a state check, a code exchanged for a token, a profile, and a session. Once you see every piece on one screen, it stops feeling like magic.

If you are a backend developer who has only ever built password logins, I hope this demo makes that first step easier.

Project: [github.com/nishantapatil3/github-sso-demo](https://github.com/nishantapatil3/github-sso-demo)

No signup form. No password to remember. Just your GitHub account and a redirect back home.
