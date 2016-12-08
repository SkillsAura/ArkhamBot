// ArkhamBot. Here we go!
(function () {
    var fork = "SkillsAura";
    function extend() {
        // [FIX] If bot doesn't load, re-start it.
        if (!window.bot) {
          return setTimeout(extend, 1 * 1000);
        }
        var bot = window.bot;

        // Load settings 
        bot.retrieveSettings();

        //Extend the bot here, either by calling another function or here directly.

        // You can add more spam words to the bot.
        
        // Load the chat package again to account for any changes
        bot.loadChat();

      }

    //Change the bots default settings and make sure they are loaded on launch

    localStorage.setItem("arkhamBotsettings", JSON.stringify({
      botName: "arkhamBot",
      language: "english",
      chatLink: "https://raw.githubusercontent.com/SkillsAura/ArkhamBot/master/lang/en.json", 
      scriptLink: "https://raw.githubusercontent.com/SkillsAura/ArkhamBot/master/script/arkhamBot.js", 
      roomLock: false, // Requires an extension to re-load the script
      startupCap: 100, // 1-200
      startupVolume: 10, // 0-100
      startupEmoji: true, // true or false
      autowoot: true,
      autoskip: false,
      smartSkip: true,
      cmdDeletion: true,
      maximumAfk: -1,
      afkRemoval: false,
      maximumDc: 120,
      bouncerPlus: true,
      blacklistEnabled: true,
      lockdownEnabled: false,
      lockGuard: false,
      maximumLocktime: 10,
      cycleGuard: false,
      maximumCycletime: 10,
      voteSkip: false,
      voteSkipLimit: 12,
      historySkip: true,
      timeGuard: true,
      maximumSongLength: 7,
      autodisable: true,
      commandCooldown: 5,
      usercommandsEnabled: true,
      skipPosition: 3,
      skipReasons: [
      ["genre", "[arkhamBot] This song does not fit the room genre. "],
      ["op", "[arkhamBot] This song is on the 'OP' List!"],
      ["history", "[arkhamBot] This song has been played recently! Skipping..."],
      ["mix", "You played a mix, which is against the rules. "],
      ["sound", [arkhamBot] "The song you played had bad sound quality or no sound. "],
      ["nsfw", "[arkhamBot] The song you contained was NSFW (image or sound). "],
      ["unavailable", "[arkhamBot] The song you played was not available for some users. "],
      ["bl", "[arkhamBot] This song is blacklisted! Skipping..."],
      ],
      afkpositionCheck: 10,
      afkRankCheck: "manager",
      motdEnabled: false,
      motdInterval: 5,
      motd: "ArkhamNetwork IP: mc.arkhamnetwork.org / play.arkhamnetwork.org",
      filterChat: false,
      etaRestriction: false,
      welcome: false,
      opLink: null,
      rulesLink: "Unavailable",
      themeLink: null,
      fbLink: null,
      youtubeLink: null,
      website: "Arkhamnetwork.org",
	  intervalMessages: ["[arkhamBot] Need to find out how long until you play? Type !eta!", "[arkhamBot] Need help? Contact a staff member!", "[arkhamBot] Ensure you follow our RULES! [https://goo.gl/mrBPBI]", "[arkhamBot] Parodys / Troll songs are DISALLOWED! You will be skipped if you play one!", "[arkhamBot] Check out our latest updates & announcements via our Twitter! https://twitter.com/arkhamnetwork"]
      messageInterval: 2,
      songstats: true,
      commandLiteral: "!",
      blacklists: {
        op: "https://raw.githubusercontent.com/SkillsAura/ArkhamBot/master/blacklists/op.json", 
        bl: "https://raw.githubusercontent.com/SkillsAura/ArkhamBot/master/blacklists/bl.json" 
      }
    }));

    // Start the bot and extend it when it has loaded.
    $.getScript("https://raw.githubusercontent.com/SkillsAura/ArkhamBot/master/script/arkhamBot.js", extend);

}).call(this);
