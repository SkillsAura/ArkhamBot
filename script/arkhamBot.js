(function () {

    /*window.onerror = function() {
        var room = JSON.parse(localStorage.getItem("arkhamBotRoom"));
        window.location = 'https://plug.dj' + room.name;
    };*/

    API.getWaitListPosition = function(id){
        if(typeof id === 'undefined' || id === null){
            id = API.getUser().id;
        }
        var wl = API.getWaitList();
        for(var i = 0; i < wl.length; i++){
            if(wl[i].id === id){
                return i;
            }
        }
        return -1;
    };

    var kill = function () {
        clearInterval(arkhamBot.room.autodisableInterval);
        clearInterval(arkhamBot.room.afkInterval);
        arkhamBot.status = false;
    };

    // This socket server is used solely for statistical and troubleshooting purposes.
    // This server may not always be up, but will be used to get live data at any given time.

    /*var socket = function () {
        function loadSocket() {
            SockJS.prototype.msg = function(a){this.send(JSON.stringify(a))};
            sock = new SockJS('https://benzi.io:4964/socket');
            sock.onopen = function() {
                console.log('Connected to socket!');
                sendToSocket();
            };
            sock.onclose = function() {
                console.log('Disconnected from socket, reconnecting every minute ..');
                var reconnect = setTimeout(function(){ loadSocket() }, 60 * 1000);
            };
            sock.onmessage = function(broadcast) {
                var rawBroadcast = broadcast.data;
                var broadcastMessage = rawBroadcast.replace(/["\\]+/g, '');
                API.chatLog(broadcastMessage);
                console.log(broadcastMessage);
            };
        }
        if (typeof SockJS == 'undefined') {
            $.getScript('https://cdn.jsdelivr.net/sockjs/1.0.3/sockjs.min.js', loadSocket);
        } else loadSocket();
    }
    var sendToSocket = function () {
        var arkhamBotSettings = arkhamBot.settings;
        var arkhamBotRoom = arkhamBot.room;
        var arkhamBotInfo = {
            time: Date.now(),
            version: arkhamBot.version
        };
        var data = {users:API.getUsers(),userinfo:API.getUser(),room:location.pathname,arkhamBotSettings:arkhamBotSettings,arkhamBotRoom:arkhamBotRoom,arkhamBotInfo:arkhamBotInfo};
        return sock.msg(data);
    };*/

    var storeToStorage = function () {
        localStorage.setItem("arkhamBotsettings", JSON.stringify(arkhamBot.settings));
        localStorage.setItem("arkhamBotRoom", JSON.stringify(arkhamBot.room));
        var arkhamBotStorageInfo = {
            time: Date.now(),
            stored: true,
            version: arkhamBot.version
        };
        localStorage.setItem("arkhamBotStorageInfo", JSON.stringify(arkhamBotStorageInfo));

    };

    var subChat = function (chat, obj) {
        if (typeof chat === "undefined") {
            API.chatLog("There is a chat text missing.");
            console.log("There is a chat text missing.");
            return "[Error] No text message found.";

            // TODO: Get missing chat messages from source.
        }
        var lit = '%%';
        for (var prop in obj) {
            chat = chat.replace(lit + prop.toUpperCase() + lit, obj[prop]);
        }
        return chat;
    };

    var loadChat = function (cb) {
        if (!cb) cb = function () {
        };
        $.get("https://rawgit.com/arkhamBot/source/master/lang/langIndex.json", function (json) {
            var link = arkhamBot.chatLink;
            if (json !== null && typeof json !== "undefined") {
                langIndex = json;
                link = langIndex[arkhamBot.settings.language.toLowerCase()];
                if (arkhamBot.settings.chatLink !== arkhamBot.chatLink) {
                    link = arkhamBot.settings.chatLink;
                }
                else {
                    if (typeof link === "undefined") {
                        link = arkhamBot.chatLink;
                    }
                }
                $.get(link, function (json) {
                    if (json !== null && typeof json !== "undefined") {
                        if (typeof json === "string") json = JSON.parse(json);
                        arkhamBot.chat = json;
                        cb();
                    }
                });
            }
            else {
                $.get(arkhamBot.chatLink, function (json) {
                    if (json !== null && typeof json !== "undefined") {
                        if (typeof json === "string") json = JSON.parse(json);
                        arkhamBot.chat = json;
                        cb();
                    }
                });
            }
        });
    };

    var retrieveSettings = function () {
        var settings = JSON.parse(localStorage.getItem("arkhamBotsettings"));
        if (settings !== null) {
            for (var prop in settings) {
                arkhamBot.settings[prop] = settings[prop];
            }
        }
    };

    var retrieveFromStorage = function () {
        var info = localStorage.getItem("arkhamBotStorageInfo");
        if (info === null) API.chatLog(arkhamBot.chat.nodatafound);
        else {
            var settings = JSON.parse(localStorage.getItem("arkhamBotsettings"));
            var room = JSON.parse(localStorage.getItem("arkhamBotRoom"));
            var elapsed = Date.now() - JSON.parse(info).time;
            if ((elapsed < 1 * 60 * 60 * 1000)) {
                API.chatLog(arkhamBot.chat.retrievingdata);
                for (var prop in settings) {
                    arkhamBot.settings[prop] = settings[prop];
                }
                arkhamBot.room.users = room.users;
                arkhamBot.room.afkList = room.afkList;
                arkhamBot.room.historyList = room.historyList;
                arkhamBot.room.mutedUsers = room.mutedUsers;
                //arkhamBot.room.autoskip = room.autoskip;
                arkhamBot.room.roomstats = room.roomstats;
                arkhamBot.room.messages = room.messages;
                arkhamBot.room.queue = room.queue;
                arkhamBot.room.newBlacklisted = room.newBlacklisted;
                API.chatLog(arkhamBot.chat.datarestored);
            }
        }
        var json_sett = null;
        var roominfo = document.getElementById("room-settings");
        info = roominfo.textContent;
        var ref_bot = "@arkhamBot=";
        var ind_ref = info.indexOf(ref_bot);
        if (ind_ref > 0) {
            var link = info.substring(ind_ref + ref_bot.length, info.length);
            var ind_space = null;
            if (link.indexOf(" ") < link.indexOf("\n")) ind_space = link.indexOf(" ");
            else ind_space = link.indexOf("\n");
            link = link.substring(0, ind_space);
            $.get(link, function (json) {
                if (json !== null && typeof json !== "undefined") {
                    json_sett = JSON.parse(json);
                    for (var prop in json_sett) {
                        arkhamBot.settings[prop] = json_sett[prop];
                    }
                }
            });
        }

    };

    String.prototype.splitBetween = function (a, b) {
        var self = this;
        self = this.split(a);
        for (var i = 0; i < self.length; i++) {
            self[i] = self[i].split(b);
        }
        var arr = [];
        for (var i = 0; i < self.length; i++) {
            if (Array.isArray(self[i])) {
                for (var j = 0; j < self[i].length; j++) {
                    arr.push(self[i][j]);
                }
            }
            else arr.push(self[i]);
        }
        return arr;
    };

    String.prototype.startsWith = function(str) {
      return this.substring(0, str.length) === str;
    };

    function linkFixer(msg) {
        var parts = msg.splitBetween('<a href="', '<\/a>');
        for (var i = 1; i < parts.length; i = i + 2) {
            var link = parts[i].split('"')[0];
            parts[i] = link;
        }
        var m = '';
        for (var i = 0; i < parts.length; i++) {
            m += parts[i];
        }
        return m;
    };

    function decodeEntities(s) {
        var str, temp = document.createElement('p');
        temp.innerHTML = s;
        str = temp.textContent || temp.innerText;
        temp = null;
        return str;
    };

    var botCreator = "Yemasthui";
    var botMaintainer = "Benzi"
    var botCreatorIDs = ["3851534", "4105209"];

    var arkhamBot = {
        version: "2.9.1",
        status: false,
        name: "arkhamBot",
        loggedInID: null,
        scriptLink: "https://rawgit.com/arkhamBot/source/master/arkhamBot.js",
        cmdLink: "http://git.io/245Ppg",
        chatLink: "https://rawgit.com/arkhamBot/source/master/lang/en.json",
        chat: null,
        loadChat: loadChat,
        retrieveSettings: retrieveSettings,
        retrieveFromStorage: retrieveFromStorage,
        settings: {
            botName: "arkhamBot",
            language: "english",
            chatLink: "https://rawgit.com/arkhamBot/source/master/lang/en.json",
            scriptLink: "https://rawgit.com/arkhamBot/source/master/arkhamBot.js",
            roomLock: false, // Requires an extension to re-load the script
            startupCap: 1, // 1-200
            startupVolume: 0, // 0-100
            startupEmoji: false, // true or false
            autowoot: true,
            autoskip: false,
            smartSkip: true,
            cmdDeletion: true,
            maximumAfk: 120,
            afkRemoval: true,
            maximumDc: 60,
            bouncerPlus: true,
            blacklistEnabled: true,
            lockdownEnabled: false,
            lockGuard: false,
            maximumLocktime: 10,
            cycleGuard: true,
            maximumCycletime: 10,
            voteSkip: false,
            voteSkipLimit: 10,
            historySkip: false,
            timeGuard: true,
            maximumSongLength: 10,
            autodisable: false,
            commandCooldown: 30,
            usercommandsEnabled: true,
            thorCommand: false,
            thorCooldown: 10,
            skipPosition: 3,
            skipReasons: [
                ["theme", "This song does not fit the room theme. "],
                ["op", "This song is on the OP list. "],
                ["history", "This song is in the history. "],
                ["mix", "You played a mix, which is against the rules. "],
                ["sound", "The song you played had bad sound quality or no sound. "],
                ["nsfw", "The song you contained was NSFW (image or sound). "],
                ["unavailable", "The song you played was not available for some users. "]
            ],
            afkpositionCheck: 15,
            afkRankCheck: "ambassador",
            motdEnabled: false,
            motdInterval: 5,
            motd: "Temporary Message of the Day",
            filterChat: true,
            etaRestriction: false,
            welcome: true,
            opLink: null,
            rulesLink: null,
            themeLink: null,
            fbLink: null,
            youtubeLink: null,
            website: null,
            intervalMessages: [],
            messageInterval: 5,
            songstats: true,
            commandLiteral: "!",
            blacklists: {
                NSFW: "https://rawgit.com/arkhamBot/custom/master/blacklists/NSFWlist.json",
                OP: "https://rawgit.com/arkhamBot/custom/master/blacklists/OPlist.json",
                BANNED: "https://rawgit.com/arkhamBot/custom/master/blacklists/BANNEDlist.json"
            }
        },
        room: {
            name: null,
            chatMessages: [],
            users: [],
            afkList: [],
            mutedUsers: [],
            bannedUsers: [],
            skippable: true,
            usercommand: true,
            allcommand: true,
            afkInterval: null,
            //autoskip: false,
            autoskipTimer: null,
            autodisableInterval: null,
            autodisableFunc: function () {
                if (arkhamBot.status && arkhamBot.settings.autodisable) {
                    API.sendChat('!afkdisable');
                    API.sendChat('!joindisable');
                }
            },
            queueing: 0,
            queueable: true,
            currentDJID: null,
            historyList: [],
            cycleTimer: setTimeout(function () {
            }, 1),
            roomstats: {
                accountName: null,
                totalWoots: 0,
                totalCurates: 0,
                totalMehs: 0,
                launchTime: null,
                songCount: 0,
                chatmessages: 0
            },
            messages: {
                from: [],
                to: [],
                message: []
            },
            queue: {
                id: [],
                position: []
            },
            blacklists: {

            },
            newBlacklisted: [],
            newBlacklistedSongFunction: null,
            roulette: {
                rouletteStatus: false,
                participants: [],
                countdown: null,
                startRoulette: function () {
                    arkhamBot.room.roulette.rouletteStatus = true;
                    arkhamBot.room.roulette.countdown = setTimeout(function () {
                        arkhamBot.room.roulette.endRoulette();
                    }, 60 * 1000);
                    API.sendChat(arkhamBot.chat.isopen);
                },
                endRoulette: function () {
                    arkhamBot.room.roulette.rouletteStatus = false;
                    var ind = Math.floor(Math.random() * arkhamBot.room.roulette.participants.length);
                    var winner = arkhamBot.room.roulette.participants[ind];
                    arkhamBot.room.roulette.participants = [];
                    var pos = Math.floor((Math.random() * API.getWaitList().length) + 1);
                    var user = arkhamBot.userUtilities.lookupUser(winner);
                    var name = user.username;
                    API.sendChat(subChat(arkhamBot.chat.winnerpicked, {name: name, position: pos}));
                    setTimeout(function (winner, pos) {
                        arkhamBot.userUtilities.moveUser(winner, pos, false);
                    }, 1 * 1000, winner, pos);
                }
            },
            usersUsedThor: []
        },
        User: function (id, name) {
            this.id = id;
            this.username = name;
            this.jointime = Date.now();
            this.lastActivity = Date.now();
            this.votes = {
                woot: 0,
                meh: 0,
                curate: 0
            };
            this.lastEta = null;
            this.afkWarningCount = 0;
            this.afkCountdown = null;
            this.inRoom = true;
            this.isMuted = false;
            this.lastDC = {
                time: null,
                position: null,
                songCount: 0
            };
            this.lastKnownPosition = null;
        },
        userUtilities: {
            getJointime: function (user) {
                return user.jointime;
            },
            getUser: function (user) {
                return API.getUser(user.id);
            },
            updatePosition: function (user, newPos) {
                user.lastKnownPosition = newPos;
            },
            updateDC: function (user) {
                user.lastDC.time = Date.now();
                user.lastDC.position = user.lastKnownPosition;
                user.lastDC.songCount = arkhamBot.room.roomstats.songCount;
            },
            setLastActivity: function (user) {
                user.lastActivity = Date.now();
                user.afkWarningCount = 0;
                clearTimeout(user.afkCountdown);
            },
            getLastActivity: function (user) {
                return user.lastActivity;
            },
            getWarningCount: function (user) {
                return user.afkWarningCount;
            },
            setWarningCount: function (user, value) {
                user.afkWarningCount = value;
            },
            lookupUser: function (id) {
                for (var i = 0; i < arkhamBot.room.users.length; i++) {
                    if (arkhamBot.room.users[i].id === id) {
                        return arkhamBot.room.users[i];
                    }
                }
                return false;
            },
            lookupUserName: function (name) {
                for (var i = 0; i < arkhamBot.room.users.length; i++) {
                    var match = arkhamBot.room.users[i].username.trim() == name.trim();
                    if (match) {
                        return arkhamBot.room.users[i];
                    }
                }
                return false;
            },
            voteRatio: function (id) {
                var user = arkhamBot.userUtilities.lookupUser(id);
                var votes = user.votes;
                if (votes.meh === 0) votes.ratio = 1;
                else votes.ratio = (votes.woot / votes.meh).toFixed(2);
                return votes;

            },
            getPermission: function (obj) { //1 requests
                var u;
                if (typeof obj === "object") u = obj;
                else u = API.getUser(obj);
                for (var i = 0; i < botCreatorIDs.length; i++) {
                    if (botCreatorIDs[i].indexOf(u.id) > -1) return 10;
                }
                if (u.gRole < 2) return u.role;
                else {
                    switch (u.gRole) {
                        case 2:
                            return 7;
                        case 3:
                            return 8;
                        case 4:
                            return 9;
                        case 5:
                            return 10;
                    }
                }
                return 0;
            },
            moveUser: function (id, pos, priority) {
                var user = arkhamBot.userUtilities.lookupUser(id);
                var wlist = API.getWaitList();
                if (API.getWaitListPosition(id) === -1) {
                    if (wlist.length < 50) {
                        API.moderateAddDJ(id);
                        if (pos !== 0) setTimeout(function (id, pos) {
                            API.moderateMoveDJ(id, pos);
                        }, 1250, id, pos);
                    }
                    else {
                        var alreadyQueued = -1;
                        for (var i = 0; i < arkhamBot.room.queue.id.length; i++) {
                            if (arkhamBot.room.queue.id[i] === id) alreadyQueued = i;
                        }
                        if (alreadyQueued !== -1) {
                            arkhamBot.room.queue.position[alreadyQueued] = pos;
                            return API.sendChat(subChat(arkhamBot.chat.alreadyadding, {position: arkhamBot.room.queue.position[alreadyQueued]}));
                        }
                        arkhamBot.roomUtilities.booth.lockBooth();
                        if (priority) {
                            arkhamBot.room.queue.id.unshift(id);
                            arkhamBot.room.queue.position.unshift(pos);
                        }
                        else {
                            arkhamBot.room.queue.id.push(id);
                            arkhamBot.room.queue.position.push(pos);
                        }
                        var name = user.username;
                        return API.sendChat(subChat(arkhamBot.chat.adding, {name: name, position: arkhamBot.room.queue.position.length}));
                    }
                }
                else API.moderateMoveDJ(id, pos);
            },
            dclookup: function (id) {
                var user = arkhamBot.userUtilities.lookupUser(id);
                if (typeof user === 'boolean') return arkhamBot.chat.usernotfound;
                var name = user.username;
                if (user.lastDC.time === null) return subChat(arkhamBot.chat.notdisconnected, {name: name});
                var dc = user.lastDC.time;
                var pos = user.lastDC.position;
                if (pos === null) return arkhamBot.chat.noposition;
                var timeDc = Date.now() - dc;
                var validDC = false;
                if (arkhamBot.settings.maximumDc * 60 * 1000 > timeDc) {
                    validDC = true;
                }
                var time = arkhamBot.roomUtilities.msToStr(timeDc);
                if (!validDC) return (subChat(arkhamBot.chat.toolongago, {name: arkhamBot.userUtilities.getUser(user).username, time: time}));
                var songsPassed = arkhamBot.room.roomstats.songCount - user.lastDC.songCount;
                var afksRemoved = 0;
                var afkList = arkhamBot.room.afkList;
                for (var i = 0; i < afkList.length; i++) {
                    var timeAfk = afkList[i][1];
                    var posAfk = afkList[i][2];
                    if (dc < timeAfk && posAfk < pos) {
                        afksRemoved++;
                    }
                }
                var newPosition = user.lastDC.position - songsPassed - afksRemoved;
                if (newPosition <= 0) return subChat(arkhamBot.chat.notdisconnected, {name: name});
                var msg = subChat(arkhamBot.chat.valid, {name: arkhamBot.userUtilities.getUser(user).username, time: time, position: newPosition});
                arkhamBot.userUtilities.moveUser(user.id, newPosition, true);
                return msg;
            }
        },

        roomUtilities: {
            rankToNumber: function (rankString) {
                var rankInt = null;
                switch (rankString) {
                    case "admin":
                        rankInt = 10;
                        break;
                    case "ambassador":
                        rankInt = 7;
                        break;
                    case "host":
                        rankInt = 5;
                        break;
                    case "cohost":
                        rankInt = 4;
                        break;
                    case "manager":
                        rankInt = 3;
                        break;
                    case "bouncer":
                        rankInt = 2;
                        break;
                    case "residentdj":
                        rankInt = 1;
                        break;
                    case "user":
                        rankInt = 0;
                        break;
                }
                return rankInt;
            },
            msToStr: function (msTime) {
                var ms, msg, timeAway;
                msg = '';
                timeAway = {
                    'days': 0,
                    'hours': 0,
                    'minutes': 0,
                    'seconds': 0
                };
                ms = {
                    'day': 24 * 60 * 60 * 1000,
                    'hour': 60 * 60 * 1000,
                    'minute': 60 * 1000,
                    'second': 1000
                };
                if (msTime > ms.day) {
                    timeAway.days = Math.floor(msTime / ms.day);
                    msTime = msTime % ms.day;
                }
                if (msTime > ms.hour) {
                    timeAway.hours = Math.floor(msTime / ms.hour);
                    msTime = msTime % ms.hour;
                }
                if (msTime > ms.minute) {
                    timeAway.minutes = Math.floor(msTime / ms.minute);
                    msTime = msTime % ms.minute;
                }
                if (msTime > ms.second) {
                    timeAway.seconds = Math.floor(msTime / ms.second);
                }
                if (timeAway.days !== 0) {
                    msg += timeAway.days.toString() + 'd';
                }
                if (timeAway.hours !== 0) {
                    msg += timeAway.hours.toString() + 'h';
                }
                if (timeAway.minutes !== 0) {
                    msg += timeAway.minutes.toString() + 'm';
                }
                if (timeAway.minutes < 1 && timeAway.hours < 1 && timeAway.days < 1) {
                    msg += timeAway.seconds.toString() + 's';
                }
                if (msg !== '') {
                    return msg;
                } else {
                    return false;
                }
            },
            booth: {
                lockTimer: setTimeout(function () {
                }, 1000),
                locked: false,
                lockBooth: function () {
                    API.moderateLockWaitList(!arkhamBot.roomUtilities.booth.locked);
                    arkhamBot.roomUtilities.booth.locked = false;
                    if (arkhamBot.settings.lockGuard) {
                        arkhamBot.roomUtilities.booth.lockTimer = setTimeout(function () {
                            API.moderateLockWaitList(arkhamBot.roomUtilities.booth.locked);
                        }, arkhamBot.settings.maximumLocktime * 60 * 1000);
                    }
                },
                unlockBooth: function () {
                    API.moderateLockWaitList(arkhamBot.roomUtilities.booth.locked);
                    clearTimeout(arkhamBot.roomUtilities.booth.lockTimer);
                }
            },
            afkCheck: function () {
                if (!arkhamBot.status || !arkhamBot.settings.afkRemoval) return void (0);
                var rank = arkhamBot.roomUtilities.rankToNumber(arkhamBot.settings.afkRankCheck);
                var djlist = API.getWaitList();
                var lastPos = Math.min(djlist.length, arkhamBot.settings.afkpositionCheck);
                if (lastPos - 1 > djlist.length) return void (0);
                for (var i = 0; i < lastPos; i++) {
                    if (typeof djlist[i] !== 'undefined') {
                        var id = djlist[i].id;
                        var user = arkhamBot.userUtilities.lookupUser(id);
                        if (typeof user !== 'boolean') {
                            var plugUser = arkhamBot.userUtilities.getUser(user);
                            if (rank !== null && arkhamBot.userUtilities.getPermission(plugUser) <= rank) {
                                var name = plugUser.username;
                                var lastActive = arkhamBot.userUtilities.getLastActivity(user);
                                var inactivity = Date.now() - lastActive;
                                var time = arkhamBot.roomUtilities.msToStr(inactivity);
                                var warncount = user.afkWarningCount;
                                if (inactivity > arkhamBot.settings.maximumAfk * 60 * 1000) {
                                    if (warncount === 0) {
                                        API.sendChat(subChat(arkhamBot.chat.warning1, {name: name, time: time}));
                                        user.afkWarningCount = 3;
                                        user.afkCountdown = setTimeout(function (userToChange) {
                                            userToChange.afkWarningCount = 1;
                                        }, 90 * 1000, user);
                                    }
                                    else if (warncount === 1) {
                                        API.sendChat(subChat(arkhamBot.chat.warning2, {name: name}));
                                        user.afkWarningCount = 3;
                                        user.afkCountdown = setTimeout(function (userToChange) {
                                            userToChange.afkWarningCount = 2;
                                        }, 30 * 1000, user);
                                    }
                                    else if (warncount === 2) {
                                        var pos = API.getWaitListPosition(id);
                                        if (pos !== -1) {
                                            pos++;
                                            arkhamBot.room.afkList.push([id, Date.now(), pos]);
                                            user.lastDC = {

                                                time: null,
                                                position: null,
                                                songCount: 0
                                            };
                                            API.moderateRemoveDJ(id);
                                            API.sendChat(subChat(arkhamBot.chat.afkremove, {name: name, time: time, position: pos, maximumafk: arkhamBot.settings.maximumAfk}));
                                        }
                                        user.afkWarningCount = 0;
                                    }
                                }
                            }
                        }
                    }
                }
            },
            smartSkip: function (reason) {
                var dj = API.getDJ();
                var id = dj.id;
                var waitlistlength = API.getWaitList().length;
                var locked = false;
                arkhamBot.room.queueable = false;

                if (waitlistlength == 50) {
                    arkhamBot.roomUtilities.booth.lockBooth();
                    locked = true;
                }
                setTimeout(function (id) {
                    API.moderateForceSkip();
                    setTimeout(function () {
                        if (typeof reason !== 'undefined') {
                            API.sendChat(reason);
                        }
                    }, 500);
                    arkhamBot.room.skippable = false;
                    setTimeout(function () {
                        arkhamBot.room.skippable = true
                    }, 5 * 1000);
                    setTimeout(function (id) {
                        arkhamBot.userUtilities.moveUser(id, arkhamBot.settings.skipPosition, false);
                        arkhamBot.room.queueable = true;
                        if (locked) {
                            setTimeout(function () {
                                arkhamBot.roomUtilities.booth.unlockBooth();
                            }, 1000);
                        }
                    }, 1500, id);
                }, 1000, id);
            },
            changeDJCycle: function () {
                $.getJSON('/_/rooms/state', function(data) {
                    if (data.data[0].booth.shouldCycle) { // checks "" "shouldCycle": true "" if its true
                        API.moderateDJCycle(false); // Disables the DJ Cycle
                        clearTimeout(arkhamBot.room.cycleTimer); // Clear the cycleguard timer
                    } else { // If cycle is already disable; enable it
                        if (arkhamBot.settings.cycleGuard) { // Is cycle guard on?
                        API.moderateDJCycle(true); // Enables DJ cycle
                        arkhamBot.room.cycleTimer = setTimeout(function () {  // Start timer
                            API.moderateDJCycle(false); // Disable cycle
                        }, arkhamBot.settings.maximumCycletime * 60 * 1000); // The time
                        } else { // So cycleguard is not on?
                         API.moderateDJCycle(true); // Enables DJ cycle
                        }
                    };
                });
            },
            intervalMessage: function () {
                var interval;
                if (arkhamBot.settings.motdEnabled) interval = arkhamBot.settings.motdInterval;
                else interval = arkhamBot.settings.messageInterval;
                if ((arkhamBot.room.roomstats.songCount % interval) === 0 && arkhamBot.status) {
                    var msg;
                    if (arkhamBot.settings.motdEnabled) {
                        msg = arkhamBot.settings.motd;
                    }
                    else {
                        if (arkhamBot.settings.intervalMessages.length === 0) return void (0);
                        var messageNumber = arkhamBot.room.roomstats.songCount % arkhamBot.settings.intervalMessages.length;
                        msg = arkhamBot.settings.intervalMessages[messageNumber];
                    }
                    API.sendChat('/me ' + msg);
                }
            },
            updateBlacklists: function () {
                for (var bl in arkhamBot.settings.blacklists) {
                    arkhamBot.room.blacklists[bl] = [];
                    if (typeof arkhamBot.settings.blacklists[bl] === 'function') {
                        arkhamBot.room.blacklists[bl] = arkhamBot.settings.blacklists();
                    }
                    else if (typeof arkhamBot.settings.blacklists[bl] === 'string') {
                        if (arkhamBot.settings.blacklists[bl] === '') {
                            continue;
                        }
                        try {
                            (function (l) {
                                $.get(arkhamBot.settings.blacklists[l], function (data) {
                                    if (typeof data === 'string') {
                                        data = JSON.parse(data);
                                    }
                                    var list = [];
                                    for (var prop in data) {
                                        if (typeof data[prop].mid !== 'undefined') {
                                            list.push(data[prop].mid);
                                        }
                                    }
                                    arkhamBot.room.blacklists[l] = list;
                                })
                            })(bl);
                        }
                        catch (e) {
                            API.chatLog('Error setting' + bl + 'blacklist.');
                            console.log('Error setting' + bl + 'blacklist.');
                            console.log(e);
                        }
                    }
                }
            },
            logNewBlacklistedSongs: function () {
                if (typeof console.table !== 'undefined') {
                    console.table(arkhamBot.room.newBlacklisted);
                }
                else {
                    console.log(arkhamBot.room.newBlacklisted);
                }
            },
            exportNewBlacklistedSongs: function () {
                var list = {};
                for (var i = 0; i < arkhamBot.room.newBlacklisted.length; i++) {
                    var track = arkhamBot.room.newBlacklisted[i];
                    list[track.list] = [];
                    list[track.list].push({
                        title: track.title,
                        author: track.author,
                        mid: track.mid
                    });
                }
                return list;
            }
        },
        eventChat: function (chat) {
            chat.message = linkFixer(chat.message);
            chat.message = decodeEntities(chat.message);
            chat.message = chat.message.trim();

            arkhamBot.room.chatMessages.push([chat.cid, chat.message, chat.sub, chat.timestamp, chat.type, chat.uid, chat.un]);

            for (var i = 0; i < arkhamBot.room.users.length; i++) {
                if (arkhamBot.room.users[i].id === chat.uid) {
                    arkhamBot.userUtilities.setLastActivity(arkhamBot.room.users[i]);
                    if (arkhamBot.room.users[i].username !== chat.un) {
                        arkhamBot.room.users[i].username = chat.un;
                    }
                }
            }
            if (arkhamBot.chatUtilities.chatFilter(chat)) return void (0);
            if (!arkhamBot.chatUtilities.commandCheck(chat))
                arkhamBot.chatUtilities.action(chat);
        },
        eventUserjoin: function (user) {
            var known = false;
            var index = null;
            for (var i = 0; i < arkhamBot.room.users.length; i++) {
                if (arkhamBot.room.users[i].id === user.id) {
                    known = true;
                    index = i;
                }
            }
            var greet = true;
            var welcomeback = null;
            if (known) {
                arkhamBot.room.users[index].inRoom = true;
                var u = arkhamBot.userUtilities.lookupUser(user.id);
                var jt = u.jointime;
                var t = Date.now() - jt;
                if (t < 10 * 1000) greet = false;
                else welcomeback = true;
            }
            else {
                arkhamBot.room.users.push(new arkhamBot.User(user.id, user.username));
                welcomeback = false;
            }
            for (var j = 0; j < arkhamBot.room.users.length; j++) {
                if (arkhamBot.userUtilities.getUser(arkhamBot.room.users[j]).id === user.id) {
                    arkhamBot.userUtilities.setLastActivity(arkhamBot.room.users[j]);
                    arkhamBot.room.users[j].jointime = Date.now();
                }

            }
            if (arkhamBot.settings.welcome && greet) {
                welcomeback ?
                    setTimeout(function (user) {
                        API.sendChat(subChat(arkhamBot.chat.welcomeback, {name: user.username}));
                    }, 1 * 1000, user)
                    :
                    setTimeout(function (user) {
                        API.sendChat(subChat(arkhamBot.chat.welcome, {name: user.username}));
                    }, 1 * 1000, user);
            }
        },
        eventUserleave: function (user) {
            var lastDJ = API.getHistory()[0].user.id;
            for (var i = 0; i < arkhamBot.room.users.length; i++) {
                if (arkhamBot.room.users[i].id === user.id) {
                    arkhamBot.userUtilities.updateDC(arkhamBot.room.users[i]);
                    arkhamBot.room.users[i].inRoom = false;
                    if (lastDJ == user.id){
                        var user = arkhamBot.userUtilities.lookupUser(arkhamBot.room.users[i].id);
                        arkhamBot.userUtilities.updatePosition(user, 0);
                        user.lastDC.time = null;
                        user.lastDC.position = user.lastKnownPosition;
                    }
                }
            }
        },
        eventVoteupdate: function (obj) {
            for (var i = 0; i < arkhamBot.room.users.length; i++) {
                if (arkhamBot.room.users[i].id === obj.user.id) {
                    if (obj.vote === 1) {
                        arkhamBot.room.users[i].votes.woot++;
                    }
                    else {
                        arkhamBot.room.users[i].votes.meh++;
                    }
                }
            }

            var mehs = API.getScore().negative;
            var woots = API.getScore().positive;
            var dj = API.getDJ();
            var timeLeft = API.getTimeRemaining();
            var timeElapsed = API.getTimeElapsed();

            if (arkhamBot.settings.voteSkip) {
                if ((mehs - woots) >= (arkhamBot.settings.voteSkipLimit)) {
                    API.sendChat(subChat(arkhamBot.chat.voteskipexceededlimit, {name: dj.username, limit: arkhamBot.settings.voteSkipLimit}));
                    if (arkhamBot.settings.smartSkip && timeLeft > timeElapsed){
                        arkhamBot.roomUtilities.smartSkip();
                    }
                    else {
                        API.moderateForceSkip();
                    }
                }
            }

        },
        eventCurateupdate: function (obj) {
            for (var i = 0; i < arkhamBot.room.users.length; i++) {
                if (arkhamBot.room.users[i].id === obj.user.id) {
                    arkhamBot.room.users[i].votes.curate++;
                }
            }
        },
        eventDjadvance: function (obj) {
            if (arkhamBot.settings.autowoot) {
                $("#woot").click(); // autowoot
            }

            var user = arkhamBot.userUtilities.lookupUser(obj.dj.id)
            for(var i = 0; i < arkhamBot.room.users.length; i++){
                if(arkhamBot.room.users[i].id === user.id){
                    arkhamBot.room.users[i].lastDC = {
                        time: null,
                        position: null,
                        songCount: 0
                    };
                }
            }

            var lastplay = obj.lastPlay;
            if (typeof lastplay === 'undefined') return;
            if (arkhamBot.settings.songstats) {
                if (typeof arkhamBot.chat.songstatistics === "undefined") {
                    API.sendChat("/me " + lastplay.media.author + " - " + lastplay.media.title + ": " + lastplay.score.positive + "W/" + lastplay.score.grabs + "G/" + lastplay.score.negative + "M.")
                }
                else {
                    API.sendChat(subChat(arkhamBot.chat.songstatistics, {artist: lastplay.media.author, title: lastplay.media.title, woots: lastplay.score.positive, grabs: lastplay.score.grabs, mehs: lastplay.score.negative}))
                }
            }
            arkhamBot.room.roomstats.totalWoots += lastplay.score.positive;
            arkhamBot.room.roomstats.totalMehs += lastplay.score.negative;
            arkhamBot.room.roomstats.totalCurates += lastplay.score.grabs;
            arkhamBot.room.roomstats.songCount++;
            arkhamBot.roomUtilities.intervalMessage();
            arkhamBot.room.currentDJID = obj.dj.id;

            var blacklistSkip = setTimeout(function () {
                var mid = obj.media.format + ':' + obj.media.cid;
                for (var bl in arkhamBot.room.blacklists) {
                    if (arkhamBot.settings.blacklistEnabled) {
                        if (arkhamBot.room.blacklists[bl].indexOf(mid) > -1) {
                            API.sendChat(subChat(arkhamBot.chat.isblacklisted, {blacklist: bl}));
                            if (arkhamBot.settings.smartSkip){
                                return arkhamBot.roomUtilities.smartSkip();
                            }
                            else {
                                return API.moderateForceSkip();
                            }
                        }
                    }
                }
            }, 2000);
            var newMedia = obj.media;
            var timeLimitSkip = setTimeout(function () {
                if (arkhamBot.settings.timeGuard && newMedia.duration > arkhamBot.settings.maximumSongLength * 60 && !arkhamBot.room.roomevent) {
                    var name = obj.dj.username;
                    API.sendChat(subChat(arkhamBot.chat.timelimit, {name: name, maxlength: arkhamBot.settings.maximumSongLength}));
                    if (arkhamBot.settings.smartSkip){
                        return arkhamBot.roomUtilities.smartSkip();
                    }
                    else {
                        return API.moderateForceSkip();
                    }
                }
            }, 2000);
            var format = obj.media.format;
            var cid = obj.media.cid;
            var naSkip = setTimeout(function () {
                if (format == 1){
                    $.getJSON('https://www.googleapis.com/youtube/v3/videos?id=' + cid + '&key=AIzaSyDcfWu9cGaDnTjPKhg_dy9mUh6H7i4ePZ0&part=snippet&callback=?', function (track){
                        if (typeof(track.items[0]) === 'undefined'){
                            var name = obj.dj.username;
                            API.sendChat(subChat(arkhamBot.chat.notavailable, {name: name}));
                            if (arkhamBot.settings.smartSkip){
                                return arkhamBot.roomUtilities.smartSkip();
                            }
                            else {
                                return API.moderateForceSkip();
                            }
                        }
                    });
                }
                else {
                    var checkSong = SC.get('/tracks/' + cid, function (track){
                        if (typeof track.title === 'undefined'){
                            var name = obj.dj.username;
                            API.sendChat(subChat(arkhamBot.chat.notavailable, {name: name}));
                            if (arkhamBot.settings.smartSkip){
                                return arkhamBot.roomUtilities.smartSkip();
                            }
                            else {
                                return API.moderateForceSkip();
                            }
                        }
                    });
                }
            }, 2000);
            clearTimeout(historySkip);
            if (arkhamBot.settings.historySkip) {
                var alreadyPlayed = false;
                var apihistory = API.getHistory();
                var name = obj.dj.username;
                var historySkip = setTimeout(function () {
                    for (var i = 0; i < apihistory.length; i++) {
                        if (apihistory[i].media.cid === obj.media.cid) {
                            arkhamBot.room.historyList[i].push(+new Date());
                            alreadyPlayed = true;
                            API.sendChat(subChat(arkhamBot.chat.songknown, {name: name}));
                            if (arkhamBot.settings.smartSkip){
                                return arkhamBot.roomUtilities.smartSkip();
                            }
                            else {
                                return API.moderateForceSkip();
                            }
                        }
                    }
                    if (!alreadyPlayed) {
                        arkhamBot.room.historyList.push([obj.media.cid, +new Date()]);
                    }
                }, 2000);
            }
            if (user.ownSong) {
                API.sendChat(subChat(arkhamBot.chat.permissionownsong, {name: user.username}));
                user.ownSong = false;
            }
            clearTimeout(arkhamBot.room.autoskipTimer);
            if (arkhamBot.settings.autoskip) {
                var remaining = obj.media.duration * 1000;
                var startcid = API.getMedia().cid;
                arkhamBot.room.autoskipTimer = setTimeout(function() {
                    var endcid = API.getMedia().cid;
                    if (startcid === endcid) {
                        //API.sendChat('Song stuck, skipping...');
                        API.moderateForceSkip();
                    }
                }, remaining + 5000);
            }
            storeToStorage();
            //sendToSocket();
        },
        eventWaitlistupdate: function (users) {
            if (users.length < 50) {
                if (arkhamBot.room.queue.id.length > 0 && arkhamBot.room.queueable) {
                    arkhamBot.room.queueable = false;
                    setTimeout(function () {
                        arkhamBot.room.queueable = true;
                    }, 500);
                    arkhamBot.room.queueing++;
                    var id, pos;
                    setTimeout(
                        function () {
                            id = arkhamBot.room.queue.id.splice(0, 1)[0];
                            pos = arkhamBot.room.queue.position.splice(0, 1)[0];
                            API.moderateAddDJ(id, pos);
                            setTimeout(
                                function (id, pos) {
                                    API.moderateMoveDJ(id, pos);
                                    arkhamBot.room.queueing--;
                                    if (arkhamBot.room.queue.id.length === 0) setTimeout(function () {
                                        arkhamBot.roomUtilities.booth.unlockBooth();
                                    }, 1000);
                                }, 1000, id, pos);
                        }, 1000 + arkhamBot.room.queueing * 2500);
                }
            }
            for (var i = 0; i < users.length; i++) {
                var user = arkhamBot.userUtilities.lookupUser(users[i].id);
                arkhamBot.userUtilities.updatePosition(user, API.getWaitListPosition(users[i].id) + 1);
            }
        },
        chatcleaner: function (chat) {
            if (!arkhamBot.settings.filterChat) return false;
            if (arkhamBot.userUtilities.getPermission(chat.uid) > 1) return false;
            var msg = chat.message;
            var containsLetters = false;
            for (var i = 0; i < msg.length; i++) {
                ch = msg.charAt(i);
                if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9') || ch === ':' || ch === '^') containsLetters = true;
            }
            if (msg === '') {
                return true;
            }
            if (!containsLetters && (msg.length === 1 || msg.length > 3)) return true;
            msg = msg.replace(/[ ,;.:\/=~+%^*\-\\"'&@#]/g, '');
            var capitals = 0;
            var ch;
            for (var i = 0; i < msg.length; i++) {
                ch = msg.charAt(i);
                if (ch >= 'A' && ch <= 'Z') capitals++;
            }
            if (capitals >= 40) {
                API.sendChat(subChat(arkhamBot.chat.caps, {name: chat.un}));
                return true;
            }
            msg = msg.toLowerCase();
            if (msg === 'skip') {
                API.sendChat(subChat(arkhamBot.chat.askskip, {name: chat.un}));
                return true;
            }
            for (var j = 0; j < arkhamBot.chatUtilities.spam.length; j++) {
                if (msg === arkhamBot.chatUtilities.spam[j]) {
                    API.sendChat(subChat(arkhamBot.chat.spam, {name: chat.un}));
                    return true;
                }
            }
            return false;
        },
        chatUtilities: {
            chatFilter: function (chat) {
                var msg = chat.message;
                var perm = arkhamBot.userUtilities.getPermission(chat.uid);
                var user = arkhamBot.userUtilities.lookupUser(chat.uid);
                var isMuted = false;
                for (var i = 0; i < arkhamBot.room.mutedUsers.length; i++) {
                    if (arkhamBot.room.mutedUsers[i] === chat.uid) isMuted = true;
                }
                if (isMuted) {
                    API.moderateDeleteChat(chat.cid);
                    return true;
                }
                if (arkhamBot.settings.lockdownEnabled) {
                    if (perm === 0) {
                        API.moderateDeleteChat(chat.cid);
                        return true;
                    }
                }
                if (arkhamBot.chatcleaner(chat)) {
                    API.moderateDeleteChat(chat.cid);
                    return true;
                }
                if (arkhamBot.settings.cmdDeletion && msg.startsWith(arkhamBot.settings.commandLiteral)) {
                    API.moderateDeleteChat(chat.cid);
                }
                /**
                 var plugRoomLinkPatt = /(\bhttps?:\/\/(www.)?plug\.dj[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
                 if (plugRoomLinkPatt.exec(msg)) {
                    if (perm === 0) {
                        API.sendChat(subChat(arkhamBot.chat.roomadvertising, {name: chat.un}));
                        API.moderateDeleteChat(chat.cid);
                        return true;
                    }
                }
                 **/
                if (msg.indexOf('http://adf.ly/') > -1) {
                    API.moderateDeleteChat(chat.cid);
                    API.sendChat(subChat(arkhamBot.chat.adfly, {name: chat.un}));
                    return true;
                }
                if (msg.indexOf('autojoin was not enabled') > 0 || msg.indexOf('AFK message was not enabled') > 0 || msg.indexOf('!afkdisable') > 0 || msg.indexOf('!joindisable') > 0 || msg.indexOf('autojoin disabled') > 0 || msg.indexOf('AFK message disabled') > 0) {
                    API.moderateDeleteChat(chat.cid);
                    return true;
                }

                var rlJoinChat = arkhamBot.chat.roulettejoin;
                var rlLeaveChat = arkhamBot.chat.rouletteleave;

                var joinedroulette = rlJoinChat.split('%%NAME%%');
                if (joinedroulette[1].length > joinedroulette[0].length) joinedroulette = joinedroulette[1];
                else joinedroulette = joinedroulette[0];

                var leftroulette = rlLeaveChat.split('%%NAME%%');
                if (leftroulette[1].length > leftroulette[0].length) leftroulette = leftroulette[1];
                else leftroulette = leftroulette[0];

                if ((msg.indexOf(joinedroulette) > -1 || msg.indexOf(leftroulette) > -1) && chat.uid === arkhamBot.loggedInID) {
                    setTimeout(function (id) {
                        API.moderateDeleteChat(id);
                    }, 5 * 1000, chat.cid);
                    return true;
                }
                return false;
            },
            commandCheck: function (chat) {
                var cmd;
                if (chat.message.charAt(0) === arkhamBot.settings.commandLiteral) {
                    var space = chat.message.indexOf(' ');
                    if (space === -1) {
                        cmd = chat.message;
                    }
                    else cmd = chat.message.substring(0, space);
                }
                else return false;
                var userPerm = arkhamBot.userUtilities.getPermission(chat.uid);
                //console.log("name: " + chat.un + ", perm: " + userPerm);
                if (chat.message !== arkhamBot.settings.commandLiteral + 'join' && chat.message !== arkhamBot.settings.commandLiteral + "leave") {
                    if (userPerm === 0 && !arkhamBot.room.usercommand) return void (0);
                    if (!arkhamBot.room.allcommand) return void (0);
                }
                if (chat.message === arkhamBot.settings.commandLiteral + 'eta' && arkhamBot.settings.etaRestriction) {
                    if (userPerm < 2) {
                        var u = arkhamBot.userUtilities.lookupUser(chat.uid);
                        if (u.lastEta !== null && (Date.now() - u.lastEta) < 1 * 60 * 60 * 1000) {
                            API.moderateDeleteChat(chat.cid);
                            return void (0);
                        }
                        else u.lastEta = Date.now();
                    }
                }
                var executed = false;

                for (var comm in arkhamBot.commands) {
                    var cmdCall = arkhamBot.commands[comm].command;
                    if (!Array.isArray(cmdCall)) {
                        cmdCall = [cmdCall]
                    }
                    for (var i = 0; i < cmdCall.length; i++) {
                        if (arkhamBot.settings.commandLiteral + cmdCall[i] === cmd) {
                            arkhamBot.commands[comm].functionality(chat, arkhamBot.settings.commandLiteral + cmdCall[i]);
                            executed = true;
                            break;
                        }
                    }
                }

                if (executed && userPerm === 0) {
                    arkhamBot.room.usercommand = false;
                    setTimeout(function () {
                        arkhamBot.room.usercommand = true;
                    }, arkhamBot.settings.commandCooldown * 1000);
                }
                if (executed) {
                    /*if (arkhamBot.settings.cmdDeletion) {
                        API.moderateDeleteChat(chat.cid);
                    }*/

                    //arkhamBot.room.allcommand = false;
                    //setTimeout(function () {
                        arkhamBot.room.allcommand = true;
                    //}, 5 * 1000);
                }
                return executed;
            },
            action: function (chat) {
                var user = arkhamBot.userUtilities.lookupUser(chat.uid);
                if (chat.type === 'message') {
                    for (var j = 0; j < arkhamBot.room.users.length; j++) {
                        if (arkhamBot.userUtilities.getUser(arkhamBot.room.users[j]).id === chat.uid) {
                            arkhamBot.userUtilities.setLastActivity(arkhamBot.room.users[j]);
                        }

                    }
                }
                arkhamBot.room.roomstats.chatmessages++;
            },
            spam: [
                'hueh', 'hu3', 'brbr', 'heu', 'brbr', 'kkkk', 'spoder', 'mafia', 'zuera', 'zueira',
                'zueria', 'aehoo', 'aheu', 'alguem', 'algum', 'brazil', 'zoeira', 'fuckadmins', 'affff', 'vaisefoder', 'huenaarea',
                'hitler', 'ashua', 'ahsu', 'ashau', 'lulz', 'huehue', 'hue', 'huehuehue', 'merda', 'pqp', 'puta', 'mulher', 'pula', 'retarda', 'caralho', 'filha', 'ppk',
                'gringo', 'fuder', 'foder', 'hua', 'ahue', 'modafuka', 'modafoka', 'mudafuka', 'mudafoka', 'ooooooooooooooo', 'foda'
            ],
            curses: [
                'nigger', 'faggot', 'nigga', 'niqqa', 'motherfucker', 'modafocka'
            ]
        },
        connectAPI: function () {
            this.proxy = {
                eventChat: $.proxy(this.eventChat, this),
                eventUserskip: $.proxy(this.eventUserskip, this),
                eventUserjoin: $.proxy(this.eventUserjoin, this),
                eventUserleave: $.proxy(this.eventUserleave, this),
                //eventFriendjoin: $.proxy(this.eventFriendjoin, this),
                eventVoteupdate: $.proxy(this.eventVoteupdate, this),
                eventCurateupdate: $.proxy(this.eventCurateupdate, this),
                eventRoomscoreupdate: $.proxy(this.eventRoomscoreupdate, this),
                eventDjadvance: $.proxy(this.eventDjadvance, this),
                //eventDjupdate: $.proxy(this.eventDjupdate, this),
                eventWaitlistupdate: $.proxy(this.eventWaitlistupdate, this),
                eventVoteskip: $.proxy(this.eventVoteskip, this),
                eventModskip: $.proxy(this.eventModskip, this),
                eventChatcommand: $.proxy(this.eventChatcommand, this),
                eventHistoryupdate: $.proxy(this.eventHistoryupdate, this),

            };
            API.on(API.CHAT, this.proxy.eventChat);
            API.on(API.USER_SKIP, this.proxy.eventUserskip);
            API.on(API.USER_JOIN, this.proxy.eventUserjoin);
            API.on(API.USER_LEAVE, this.proxy.eventUserleave);
            API.on(API.VOTE_UPDATE, this.proxy.eventVoteupdate);
            API.on(API.GRAB_UPDATE, this.proxy.eventCurateupdate);
            API.on(API.ROOM_SCORE_UPDATE, this.proxy.eventRoomscoreupdate);
            API.on(API.ADVANCE, this.proxy.eventDjadvance);
            API.on(API.WAIT_LIST_UPDATE, this.proxy.eventWaitlistupdate);
            API.on(API.MOD_SKIP, this.proxy.eventModskip);
            API.on(API.CHAT_COMMAND, this.proxy.eventChatcommand);
            API.on(API.HISTORY_UPDATE, this.proxy.eventHistoryupdate);
        },
        disconnectAPI: function () {
            API.off(API.CHAT, this.proxy.eventChat);
            API.off(API.USER_SKIP, this.proxy.eventUserskip);
            API.off(API.USER_JOIN, this.proxy.eventUserjoin);
            API.off(API.USER_LEAVE, this.proxy.eventUserleave);
            API.off(API.VOTE_UPDATE, this.proxy.eventVoteupdate);
            API.off(API.CURATE_UPDATE, this.proxy.eventCurateupdate);
            API.off(API.ROOM_SCORE_UPDATE, this.proxy.eventRoomscoreupdate);
            API.off(API.ADVANCE, this.proxy.eventDjadvance);
            API.off(API.WAIT_LIST_UPDATE, this.proxy.eventWaitlistupdate);
            API.off(API.MOD_SKIP, this.proxy.eventModskip);
            API.off(API.CHAT_COMMAND, this.proxy.eventChatcommand);
            API.off(API.HISTORY_UPDATE, this.proxy.eventHistoryupdate);
        },
        startup: function () {
            Function.prototype.toString = function () {
                return 'Function.'
            };
            var u = API.getUser();
            if (arkhamBot.userUtilities.getPermission(u) < 2) return API.chatLog(arkhamBot.chat.greyuser);
            if (arkhamBot.userUtilities.getPermission(u) === 2) API.chatLog(arkhamBot.chat.bouncer);
            arkhamBot.connectAPI();
            API.moderateDeleteChat = function (cid) {
                $.ajax({
                    url: "/_/chat/" + cid,
                    type: "DELETE"
                })
            };

            arkhamBot.room.name = window.location.pathname;
            var Check;

            console.log(arkhamBot.room.name);

            var detect = function(){
                if(arkhamBot.room.name != window.location.pathname){
                    console.log("Killing bot after room change.");
                    storeToStorage();
                    arkhamBot.disconnectAPI();
                    setTimeout(function () {
                        kill();
                    }, 1000);
                    if (arkhamBot.settings.roomLock){
                        window.location = arkhamBot.room.name;
                    }
                    else {
                        clearInterval(Check);
                    }
                }
            };

            Check = setInterval(function(){ detect() }, 2000);

            retrieveSettings();
            retrieveFromStorage();
            window.bot = arkhamBot;
            arkhamBot.roomUtilities.updateBlacklists();
            setInterval(arkhamBot.roomUtilities.updateBlacklists, 60 * 60 * 1000);
            arkhamBot.getNewBlacklistedSongs = arkhamBot.roomUtilities.exportNewBlacklistedSongs;
            arkhamBot.logNewBlacklistedSongs = arkhamBot.roomUtilities.logNewBlacklistedSongs;
            if (arkhamBot.room.roomstats.launchTime === null) {
                arkhamBot.room.roomstats.launchTime = Date.now();
            }

            for (var j = 0; j < arkhamBot.room.users.length; j++) {
                arkhamBot.room.users[j].inRoom = false;
            }
            var userlist = API.getUsers();
            for (var i = 0; i < userlist.length; i++) {
                var known = false;
                var ind = null;
                for (var j = 0; j < arkhamBot.room.users.length; j++) {
                    if (arkhamBot.room.users[j].id === userlist[i].id) {
                        known = true;
                        ind = j;
                    }
                }
                if (known) {
                    arkhamBot.room.users[ind].inRoom = true;
                }
                else {
                    arkhamBot.room.users.push(new arkhamBot.User(userlist[i].id, userlist[i].username));
                    ind = arkhamBot.room.users.length - 1;
                }
                var wlIndex = API.getWaitListPosition(arkhamBot.room.users[ind].id) + 1;
                arkhamBot.userUtilities.updatePosition(arkhamBot.room.users[ind], wlIndex);
            }
            arkhamBot.room.afkInterval = setInterval(function () {
                arkhamBot.roomUtilities.afkCheck()
            }, 10 * 1000);
            arkhamBot.room.autodisableInterval = setInterval(function () {
                arkhamBot.room.autodisableFunc();
            }, 60 * 60 * 1000);
            arkhamBot.loggedInID = API.getUser().id;
            arkhamBot.status = true;
/*            API.sendChat('/cap ' + arkhamBot.settings.startupCap); */
/*            API.setVolume(arkhamBot.settings.startupVolume); */
            if (arkhamBot.settings.autowoot) {
                $("#woot").click();
            }
/*            if (arkhamBot.settings.startupEmoji) {
                var emojibuttonoff = $(".icon-emoji-off");
                if (emojibuttonoff.length > 0) {
                    emojibuttonoff[0].click();
                }
                API.chatLog('Emojis enabled.');
            }
            else {
                var emojibuttonon = $(".icon-emoji-on");
                if (emojibuttonon.length > 0) {
                    emojibuttonon[0].click();
                }
                API.chatLog('Emojis disabled.');
            } */
            API.chatLog('Avatars capping disabled. Preceeding settings loaded.'); 
            API.chatLog('Volume setting disabled. Preceeding settings loaded.'); 
            API.chatLog('Emoji toggling disabled. Preceeding settings loaded.');
            //socket();
            loadChat(API.sendChat(subChat(arkhamBot.chat.online, {botname: arkhamBot.settings.botName, version: arkhamBot.version})));
        },
        commands: {
            executable: function (minRank, chat) {
                var id = chat.uid;
                var perm = arkhamBot.userUtilities.getPermission(id);
                var minPerm;
                switch (minRank) {
                    case 'admin':
                        minPerm = 10;
                        break;
                    case 'ambassador':
                        minPerm = 7;
                        break;
                    case 'host':
                        minPerm = 5;
                        break;
                    case 'cohost':
                        minPerm = 4;
                        break;
                    case 'manager':
                        minPerm = 3;
                        break;
                    case 'mod':
                        if (arkhamBot.settings.bouncerPlus) {
                            minPerm = 2;
                        }
                        else {
                            minPerm = 3;
                        }
                        break;
                    case 'bouncer':
                        minPerm = 2;
                        break;
                    case 'residentdj':
                        minPerm = 1;
                        break;
                    case 'user':
                        minPerm = 0;
                        break;
                    default:
                        API.chatLog('[Error] Error assigning minimum permission');
                }
                return perm >= minPerm;

            },
            /**
             command: {
                        command: 'cmd',
                        rank: 'user/bouncer/mod/manager',
                        type: 'startsWith/exact',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !arkhamBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                }
                        }
                },
             **/

            activeCommand: {
                command: 'active',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var now = Date.now();
                        var chatters = 0;
                        var time;

                        var launchT = arkhamBot.room.roomstats.launchTime;
                        var durationOnline = Date.now() - launchT;
                        var since = durationOnline / 1000;

                        if (msg.length === cmd.length) time = since;
                        else {
                            time = msg.substring(cmd.length + 1);
                            if (isNaN(time)) return API.sendChat(subChat(arkhamBot.chat.invalidtime, {name: chat.un}));
                        }
                        for (var i = 0; i < arkhamBot.room.users.length; i++) {
                            userTime = arkhamBot.userUtilities.getLastActivity(arkhamBot.room.users[i]);
                            if ((now - userTime) <= (time * 60 * 1000)) {
                                chatters++;
                            }
                        }
                        API.sendChat(subChat(arkhamBot.chat.activeusersintime, {name: chat.un, amount: chatters, time: time}));
                    }
                }
            },

            addCommand: {
                command: 'add',
                rank: 'mod',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(arkhamBot.chat.nouserspecified, {name: chat.un}));
                        var name = msg.substr(cmd.length + 2);
                        var user = arkhamBot.userUtilities.lookupUserName(name);
                        if (msg.length > cmd.length + 2) {
                            if (typeof user !== 'undefined') {
                                if (arkhamBot.room.roomevent) {
                                    arkhamBot.room.eventArtists.push(user.id);
                                }
                                API.moderateAddDJ(user.id);
                            } else API.sendChat(subChat(arkhamBot.chat.invaliduserspecified, {name: chat.un}));
                        }
                    }
                }
            },

            afklimitCommand: {
                command: 'afklimit',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(arkhamBot.chat.nolimitspecified, {name: chat.un}));
                        var limit = msg.substring(cmd.length + 1);
                        if (!isNaN(limit)) {
                            arkhamBot.settings.maximumAfk = parseInt(limit, 10);
                            API.sendChat(subChat(arkhamBot.chat.maximumafktimeset, {name: chat.un, time: arkhamBot.settings.maximumAfk}));
                        }
                        else API.sendChat(subChat(arkhamBot.chat.invalidlimitspecified, {name: chat.un}));
                    }
                }
            },

            afkremovalCommand: {
                command: 'afkremoval',
                rank: 'mod',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (arkhamBot.settings.afkRemoval) {
                            arkhamBot.settings.afkRemoval = !arkhamBot.settings.afkRemoval;
                            clearInterval(arkhamBot.room.afkInterval);
                            API.sendChat(subChat(arkhamBot.chat.toggleoff, {name: chat.un, 'function': arkhamBot.chat.afkremoval}));
                        }
                        else {
                            arkhamBot.settings.afkRemoval = !arkhamBot.settings.afkRemoval;
                            arkhamBot.room.afkInterval = setInterval(function () {
                                arkhamBot.roomUtilities.afkCheck()
                            }, 2 * 1000);
                            API.sendChat(subChat(arkhamBot.chat.toggleon, {name: chat.un, 'function': arkhamBot.chat.afkremoval}));
                        }
                    }
                }
            },

            afkresetCommand: {
                command: 'afkreset',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(arkhamBot.chat.nouserspecified, {name: chat.un}));
                        var name = msg.substring(cmd.length + 2);
                        var user = arkhamBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(arkhamBot.chat.invaliduserspecified, {name: chat.un}));
                        arkhamBot.userUtilities.setLastActivity(user);
                        API.sendChat(subChat(arkhamBot.chat.afkstatusreset, {name: chat.un, username: name}));
                    }
                }
            },

            afktimeCommand: {
                command: 'afktime',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(arkhamBot.chat.nouserspecified, {name: chat.un}));
                        var name = msg.substring(cmd.length + 2);
                        var user = arkhamBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(arkhamBot.chat.invaliduserspecified, {name: chat.un}));
                        var lastActive = arkhamBot.userUtilities.getLastActivity(user);
                        var inactivity = Date.now() - lastActive;
                        var time = arkhamBot.roomUtilities.msToStr(inactivity);

                        var launchT = arkhamBot.room.roomstats.launchTime;
                        var durationOnline = Date.now() - launchT;

                        if (inactivity == durationOnline){
                            API.sendChat(subChat(arkhamBot.chat.inactivelonger, {botname: arkhamBot.settings.botName, name: chat.un, username: name}));
                        } else {
                        API.sendChat(subChat(arkhamBot.chat.inactivefor, {name: chat.un, username: name, time: time}));
                        }
                    }
                }
            },

            autodisableCommand: {
                command: 'autodisable',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (arkhamBot.settings.autodisable) {
                            arkhamBot.settings.autodisable = !arkhamBot.settings.autodisable;
                            return API.sendChat(subChat(arkhamBot.chat.toggleoff, {name: chat.un, 'function': arkhamBot.chat.autodisable}));
                        }
                        else {
                            arkhamBot.settings.autodisable = !arkhamBot.settings.autodisable;
                            return API.sendChat(subChat(arkhamBot.chat.toggleon, {name: chat.un, 'function': arkhamBot.chat.autodisable}));
                        }

                    }
                }
            },

            autoskipCommand: {
                command: 'autoskip',
                rank: 'mod',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (arkhamBot.settings.autoskip) {
                            arkhamBot.settings.autoskip = !arkhamBot.settings.autoskip;
                            clearTimeout(arkhamBot.room.autoskipTimer);
                            return API.sendChat(subChat(arkhamBot.chat.toggleoff, {name: chat.un, 'function': arkhamBot.chat.autoskip}));
                        }
                        else {
                            arkhamBot.settings.autoskip = !arkhamBot.settings.autoskip;
                            return API.sendChat(subChat(arkhamBot.chat.toggleon, {name: chat.un, 'function': arkhamBot.chat.autoskip}));
                        }
                    }
                }
            },

            autowootCommand: {
                command: 'autowoot',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat(arkhamBot.chat.autowoot);
                    }
                }
            },

            baCommand: {
                command: 'ba',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat(arkhamBot.chat.brandambassador);
                    }
                }
            },

            ballCommand: {
                command: ['8ball', 'ask'],
                rank: 'user',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                            var crowd = API.getUsers();
                            var msg = chat.message;
                            var argument = msg.substring(cmd.length + 1).replace(/@/g, '');
                            var randomUser = Math.floor(Math.random() * crowd.length);
                            var randomBall = Math.floor(Math.random() * arkhamBot.chat.balls.length);
                            var randomSentence = Math.floor(Math.random() * 1);
                            API.sendChat(subChat(arkhamBot.chat.ball, {name: chat.un, botname: arkhamBot.settings.botName, question: argument, response: arkhamBot.chat.balls[randomBall]}));
                     }
                }
            },

            banCommand: {
                command: 'ban',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(arkhamBot.chat.nouserspecified, {name: chat.un}));
                        var name = msg.substr(cmd.length + 2);
                        var user = arkhamBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(arkhamBot.chat.invaliduserspecified, {name: chat.un}));
                        var permFrom = arkhamBot.userUtilities.getPermission(chat.uid);
                        var permUser = arkhamBot.userUtilities.getPermission(user.id);
                        if (permUser >= permFrom) return void(0);
                        API.moderateBanUser(user.id, 1, API.BAN.DAY);
                    }
                }
            },

            blacklistCommand: {
                command: ['blacklist', 'bl'],
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(arkhamBot.chat.nolistspecified, {name: chat.un}));
                        var list = msg.substr(cmd.length + 1);
                        if (typeof arkhamBot.room.blacklists[list] === 'undefined') return API.sendChat(subChat(arkhamBot.chat.invalidlistspecified, {name: chat.un}));
                        else {
                            var media = API.getMedia();
                            var timeLeft = API.getTimeRemaining();
                            var timeElapsed = API.getTimeElapsed();
                            var track = {
                                list: list,
                                author: media.author,
                                title: media.title,
                                mid: media.format + ':' + media.cid
                            };
                            arkhamBot.room.newBlacklisted.push(track);
                            arkhamBot.room.blacklists[list].push(media.format + ':' + media.cid);
                            API.sendChat(subChat(arkhamBot.chat.newblacklisted, {name: chat.un, blacklist: list, author: media.author, title: media.title, mid: media.format + ':' + media.cid}));
                            if (arkhamBot.settings.smartSkip && timeLeft > timeElapsed){
                                arkhamBot.roomUtilities.smartSkip();
                            }
                            else {
                                API.moderateForceSkip();
                            }
                            if (typeof arkhamBot.room.newBlacklistedSongFunction === 'function') {
                                arkhamBot.room.newBlacklistedSongFunction(track);
                            }
                        }
                    }
                }
            },

            blinfoCommand: {
                command: 'blinfo',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var author = API.getMedia().author;
                        var title = API.getMedia().title;
                        var name = chat.un;
                        var format = API.getMedia().format;
                        var cid = API.getMedia().cid;
                        var songid = format + ":" + cid;

                        API.sendChat(subChat(arkhamBot.chat.blinfo, {name: name, author: author, title: title, songid: songid}));
                    }
                }
            },

            bouncerPlusCommand: {
                command: 'bouncer+',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (arkhamBot.settings.bouncerPlus) {
                            arkhamBot.settings.bouncerPlus = false;
                            return API.sendChat(subChat(arkhamBot.chat.toggleoff, {name: chat.un, 'function': 'Bouncer+'}));
                        }
                        else {
                            if (!arkhamBot.settings.bouncerPlus) {
                                var id = chat.uid;
                                var perm = arkhamBot.userUtilities.getPermission(id);
                                if (perm > 2) {
                                    arkhamBot.settings.bouncerPlus = true;
                                    return API.sendChat(subChat(arkhamBot.chat.toggleon, {name: chat.un, 'function': 'Bouncer+'}));
                                }
                            }
                            else return API.sendChat(subChat(arkhamBot.chat.bouncerplusrank, {name: chat.un}));
                        }
                    }
                }
            },

            botnameCommand: {
                command: 'botname',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length <= cmd.length + 1) return API.sendChat(subChat(arkhamBot.chat.currentbotname, {botname: arkhamBot.settings.botName}));
                        var argument = msg.substring(cmd.length + 1);
                        if (argument) {
                            arkhamBot.settings.botName = argument;
                            API.sendChat(subChat(arkhamBot.chat.botnameset, {botName: arkhamBot.settings.botName}));
                        }
                    }
                }
            },

            clearchatCommand: {
                command: 'clearchat',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var currentchat = $('#chat-messages').children();
                        for (var i = 0; i < currentchat.length; i++) {
                            API.moderateDeleteChat(currentchat[i].getAttribute("data-cid"));
                        }
                        return API.sendChat(subChat(arkhamBot.chat.chatcleared, {name: chat.un}));
                    }
                }
            },

            clearlocalstorageCommand: {
                command: 'clearlocalstorage',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        localStorage.clear();
                        API.chatLog('Cleared localstorage, please refresh the page!');
                    }
                }
            },

            cmddeletionCommand: {
                command: ['commanddeletion', 'cmddeletion', 'cmddel'],
                rank: 'mod',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (arkhamBot.settings.cmdDeletion) {
                            arkhamBot.settings.cmdDeletion = !arkhamBot.settings.cmdDeletion;
                            API.sendChat(subChat(arkhamBot.chat.toggleoff, {name: chat.un, 'function': arkhamBot.chat.cmddeletion}));
                        }
                        else {
                            arkhamBot.settings.cmdDeletion = !arkhamBot.settings.cmdDeletion;
                            API.sendChat(subChat(arkhamBot.chat.toggleon, {name: chat.un, 'function': arkhamBot.chat.cmddeletion}));
                        }
                    }
                }
            },

            commandsCommand: {
                command: 'commands',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat(subChat(arkhamBot.chat.commandslink, {botname: arkhamBot.settings.botName, link: arkhamBot.cmdLink}));
                    }
                }
            },

            cookieCommand: {
                command: 'cookie',
                rank: 'user',
                type: 'startsWith',
                getCookie: function (chat) {
                    var c = Math.floor(Math.random() * arkhamBot.chat.cookies.length);
                    return arkhamBot.chat.cookies[c];
                },
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;

                        var space = msg.indexOf(' ');
                        if (space === -1) {
                            API.sendChat(arkhamBot.chat.eatcookie);
                            return false;
                        }
                        else {
                            var name = msg.substring(space + 2);
                            var user = arkhamBot.userUtilities.lookupUserName(name);
                            if (user === false || !user.inRoom) {
                                return API.sendChat(subChat(arkhamBot.chat.nousercookie, {name: name}));
                            }
                            else if (user.username === chat.un) {
                                return API.sendChat(subChat(arkhamBot.chat.selfcookie, {name: name}));
                            }
                            else {
                                return API.sendChat(subChat(arkhamBot.chat.cookie, {nameto: user.username, namefrom: chat.un, cookie: this.getCookie()}));
                            }
                        }
                    }
                }
            },

            cycleCommand: {
                command: 'cycle',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        arkhamBot.roomUtilities.changeDJCycle();
                    }
                }
            },

            cycleguardCommand: {
                command: 'cycleguard',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (arkhamBot.settings.cycleGuard) {
                            arkhamBot.settings.cycleGuard = !arkhamBot.settings.cycleGuard;
                            return API.sendChat(subChat(arkhamBot.chat.toggleoff, {name: chat.un, 'function': arkhamBot.chat.cycleguard}));
                        }
                        else {
                            arkhamBot.settings.cycleGuard = !arkhamBot.settings.cycleGuard;
                            return API.sendChat(subChat(arkhamBot.chat.toggleon, {name: chat.un, 'function': arkhamBot.chat.cycleguard}));
                        }

                    }
                }
            },

            cycletimerCommand: {
                command: 'cycletimer',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var cycleTime = msg.substring(cmd.length + 1);
                        if (!isNaN(cycleTime) && cycleTime !== "") {
                            arkhamBot.settings.maximumCycletime = cycleTime;
                            return API.sendChat(subChat(arkhamBot.chat.cycleguardtime, {name: chat.un, time: arkhamBot.settings.maximumCycletime}));
                        }
                        else return API.sendChat(subChat(arkhamBot.chat.invalidtime, {name: chat.un}));

                    }
                }
            },

            dclookupCommand: {
                command: ['dclookup', 'dc'],
                rank: 'user',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var name;
                        if (msg.length === cmd.length) name = chat.un;
                        else {
                            name = msg.substring(cmd.length + 2);
                            var perm = arkhamBot.userUtilities.getPermission(chat.uid);
                            if (perm < 2) return API.sendChat(subChat(arkhamBot.chat.dclookuprank, {name: chat.un}));
                        }
                        var user = arkhamBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(arkhamBot.chat.invaliduserspecified, {name: chat.un}));
                        var toChat = arkhamBot.userUtilities.dclookup(user.id);
                        API.sendChat(toChat);
                    }
                }
            },

            /*
            // This does not work anymore.
            deletechatCommand: {
                command: 'deletechat',
                rank: 'mod',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(arkhamBot.chat.nouserspecified, {name: chat.un}));
                        var name = msg.substring(cmd.length + 2);
                        var user = arkhamBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(arkhamBot.chat.invaliduserspecified, {name: chat.un}));
                        var chats = $('.from');
                        var message = $('.message');
                        var emote = $('.emote');
                        var from = $('.un.clickable');
                        for (var i = 0; i < chats.length; i++) {
                            var n = from[i].textContent;
                            if (name.trim() === n.trim()) {
                                // var messagecid = $(message)[i].getAttribute('data-cid');
                                // var emotecid = $(emote)[i].getAttribute('data-cid');
                                // API.moderateDeleteChat(messagecid);
                                // try {
                                //     API.moderateDeleteChat(messagecid);
                                // }
                                // finally {
                                //     API.moderateDeleteChat(emotecid);
                                // }
                                if (typeof $(message)[i].getAttribute('data-cid') == "undefined"){
                                    API.moderateDeleteChat($(emote)[i].getAttribute('data-cid')); // works well with normal messages but not with emotes due to emotes and messages are seperate.
                                } else {
                                    API.moderateDeleteChat($(message)[i].getAttribute('data-cid'));
                                }
                            }
                        }
                        API.sendChat(subChat(arkhamBot.chat.deletechat, {name: chat.un, username: name}));
                    }
                }
            },
            */

            deletechatCommand: {
                command: 'deletechat',
                rank: 'mod',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(arkhamBot.chat.nouserspecified, {name: chat.un}));
                        var name = msg.substring(cmd.length + 2);
                        var user = arkhamBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(arkhamBot.chat.invaliduserspecified, {name: chat.un}));
                        for (var i = 1; i < arkhamBot.room.chatMessages.length; i++) {
                          if (arkhamBot.room.chatMessages[i].indexOf(user.id) > -1){
                            API.moderateDeleteChat(arkhamBot.room.chatMessages[i][0]);
                            arkhamBot.room.chatMessages[i].splice(0);
                          }
                        }
                        API.sendChat(subChat(arkhamBot.chat.deletechat, {name: chat.un, username: name}));
                    }
                }
            },


            emojiCommand: {
                command: 'emoji',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var link = 'http://www.emoji-cheat-sheet.com/';
                        API.sendChat(subChat(arkhamBot.chat.emojilist, {link: link}));
                    }
                }
            },

            englishCommand: {
                command: 'english',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if(chat.message.length === cmd.length) return API.sendChat('/me No user specified.');
                        var name = chat.message.substring(cmd.length + 2);
                        var user = arkhamBot.userUtilities.lookupUserName(name);
                        if(typeof user === 'boolean') return API.sendChat('/me Invalid user specified.');
                        var lang = arkhamBot.userUtilities.getUser(user).language;
                        var ch = '/me @' + name + ' ';
                        switch(lang){
                            case 'en': break;
                            case 'da': ch += 'Vær venlig at tale engelsk.'; break;
                            case 'de': ch += 'Bitte sprechen Sie Englisch.'; break;
                            case 'es': ch += 'Por favor, hable Inglés.'; break;
                            case 'fr': ch += 'Parlez anglais, s\'il vous plaît.'; break;
                            case 'nl': ch += 'Spreek Engels, alstublieft.'; break;
                            case 'pl': ch += 'Proszę mówić po angielsku.'; break;
                            case 'pt': ch += 'Por favor, fale Inglês.'; break;
                            case 'sk': ch += 'Hovorte po anglicky, prosím.'; break;
                            case 'cs': ch += 'Mluvte prosím anglicky.'; break;
                            case 'sr': ch += 'Молим Вас, говорите енглески.'; break;
                        }
                        ch += ' English please.';
                        API.sendChat(ch);
                    }
                }
            },

            etaCommand: {
                command: 'eta',
                rank: 'user',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var perm = arkhamBot.userUtilities.getPermission(chat.uid);
                        var msg = chat.message;
                        var dj = API.getDJ().username;
                        var name;
                        if (msg.length > cmd.length) {
                            if (perm < 2) return void (0);
                            name = msg.substring(cmd.length + 2);
                        } else name = chat.un;
                        var user = arkhamBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(arkhamBot.chat.invaliduserspecified, {name: chat.un}));
                        var pos = API.getWaitListPosition(user.id);
                        var realpos = pos + 1;
                        if (name == dj) return API.sendChat(subChat(arkhamBot.chat.youaredj, {name: name}));
                        if (pos < 0) return API.sendChat(subChat(arkhamBot.chat.notinwaitlist, {name: name}));
                        if (pos == 0) return API.sendChat(subChat(arkhamBot.chat.youarenext, {name: name}));
                        var timeRemaining = API.getTimeRemaining();
                        var estimateMS = ((pos + 1) * 4 * 60 + timeRemaining) * 1000;
                        var estimateString = arkhamBot.roomUtilities.msToStr(estimateMS);
                        API.sendChat(subChat(arkhamBot.chat.eta, {name: name, time: estimateString, position: realpos}));
                    }
                }
            },

            fbCommand: {
                command: 'fb',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (typeof arkhamBot.settings.fbLink === "string")
                            API.sendChat(subChat(arkhamBot.chat.facebook, {link: arkhamBot.settings.fbLink}));
                    }
                }
            },

            filterCommand: {
                command: 'filter',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (arkhamBot.settings.filterChat) {
                            arkhamBot.settings.filterChat = !arkhamBot.settings.filterChat;
                            return API.sendChat(subChat(arkhamBot.chat.toggleoff, {name: chat.un, 'function': arkhamBot.chat.chatfilter}));
                        }
                        else {
                            arkhamBot.settings.filterChat = !arkhamBot.settings.filterChat;
                            return API.sendChat(subChat(arkhamBot.chat.toggleon, {name: chat.un, 'function': arkhamBot.chat.chatfilter}));
                        }
                    }
                }
            },

            forceskipCommand: {
                command: ['forceskip', 'fs'],
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat(subChat(arkhamBot.chat.forceskip, {name: chat.un}));
                        API.moderateForceSkip();
                        arkhamBot.room.skippable = false;
                        setTimeout(function () {
                            arkhamBot.room.skippable = true
                        }, 5 * 1000);

                    }
                }
            },

            ghostbusterCommand: {
                command: 'ghostbuster',
                rank: 'user',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var name;
                        if (msg.length === cmd.length) name = chat.un;
                        else {
                            name = msg.substr(cmd.length + 2);
                        }
                        var user = arkhamBot.userUtilities.lookupUserName(name);
                        if (user === false || !user.inRoom) {
                            return API.sendChat(subChat(arkhamBot.chat.ghosting, {name1: chat.un, name2: name}));
                        }
                        else API.sendChat(subChat(arkhamBot.chat.notghosting, {name1: chat.un, name2: name}));
                    }
                }
            },

            gifCommand: {
                command: ['dontusethisgoddamncommandyougaylookingdipshitfucktard'],
                rank: 'user',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length !== cmd.length) {
                            function get_id(api_key, fixedtag, func)
                            {
                                $.getJSON(
                                    "https://tv.giphy.com/v1/gifs/random?",
                                    {
                                        "format": "json",
                                        "api_key": api_key,
                                        "rating": rating,
                                        "tag": fixedtag
                                    },
                                    function(response)
                                    {
                                        func(response.data.id);
                                    }
                                    )
                            }
                            var api_key = "dc6zaTOxFJmzC"; // public beta key
                            var rating = "pg-13"; // PG 13 gifs
                            var tag = msg.substr(cmd.length + 1);
                            var fixedtag = tag.replace(/ /g,"+");
                            var commatag = tag.replace(/ /g,", ");
                            get_id(api_key, tag, function(id) {
                                if (typeof id !== 'undefined') {
                                    API.sendChat(subChat(arkhamBot.chat.validgiftags, {name: chat.un, id: id, tags: commatag}));
                                } else {
                                    API.sendChat(subChat(arkhamBot.chat.invalidgiftags, {name: chat.un, tags: commatag}));
                                }
                            });
                        }
                        else {
                            function get_random_id(api_key, func)
                            {
                                $.getJSON(
                                    "https://tv.giphy.com/v1/gifs/random?",
                                    {
                                        "format": "json",
                                        "api_key": api_key,
                                        "rating": rating
                                    },
                                    function(response)
                                    {
                                        func(response.data.id);
                                    }
                                    )
                            }
                            var api_key = "dc6zaTOxFJmzC"; // public beta key
                            var rating = "pg-13"; // PG 13 gifs
                            get_random_id(api_key, function(id) {
                                if (typeof id !== 'undefined') {
                                    API.sendChat(subChat(arkhamBot.chat.validgifrandom, {name: chat.un, id: id}));
                                } else {
                                    API.sendChat(subChat(arkhamBot.chat.invalidgifrandom, {name: chat.un}));
                                }
                            });
                        }
                    }
                }
            },

            helpCommand: {
                command: 'help',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var link = "(Updated link coming soon)";
                        API.sendChat(subChat(arkhamBot.chat.starterhelp, {link: link}));
                    }
                }
            },

            historyskipCommand: {
                command: 'historyskip',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (arkhamBot.settings.historySkip) {
                            arkhamBot.settings.historySkip = !arkhamBot.settings.historySkip;
                            API.sendChat(subChat(arkhamBot.chat.toggleoff, {name: chat.un, 'function': arkhamBot.chat.historyskip}));
                        }
                        else {
                            arkhamBot.settings.historySkip = !arkhamBot.settings.historySkip;
                            API.sendChat(subChat(arkhamBot.chat.toggleon, {name: chat.un, 'function': arkhamBot.chat.historyskip}));
                        }
                    }
                }
            },

            joinCommand: {
                command: 'join',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (arkhamBot.room.roulette.rouletteStatus && arkhamBot.room.roulette.participants.indexOf(chat.uid) < 0) {
                            arkhamBot.room.roulette.participants.push(chat.uid);
                            API.sendChat(subChat(arkhamBot.chat.roulettejoin, {name: chat.un}));
                        }
                    }
                }
            },

            jointimeCommand: {
                command: 'jointime',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(arkhamBot.chat.nouserspecified, {name: chat.un}));
                        var name = msg.substring(cmd.length + 2);
                        var user = arkhamBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(arkhamBot.chat.invaliduserspecified, {name: chat.un}));
                        var join = arkhamBot.userUtilities.getJointime(user);
                        var time = Date.now() - join;
                        var timeString = arkhamBot.roomUtilities.msToStr(time);
                        API.sendChat(subChat(arkhamBot.chat.jointime, {namefrom: chat.un, username: name, time: timeString}));
                    }
                }
            },

            kickCommand: {
                command: 'kick',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat("/me This feature has been temporarily disabled! Please manually execute ban and unban instead!");
                    }
                }
            },

            killCommand: {
                command: 'kill',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        storeToStorage();
                        //sendToSocket();
                        API.sendChat(arkhamBot.chat.kill);
                        arkhamBot.disconnectAPI();
                        setTimeout(function () {
                            kill();
                        }, 1000);
                    }
                }
            },

            languageCommand: {
                command: 'language',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length <= cmd.length + 1) return API.sendChat(subChat(arkhamBot.chat.currentlang, {language: arkhamBot.settings.language}));
                        var argument = msg.substring(cmd.length + 1);

                        $.get("https://rawgit.com/arkhamBot/source/master/lang/langIndex.json", function (json) {
                            var langIndex = json;
                            var link = langIndex[argument.toLowerCase()];
                            if (typeof link === "undefined") {
                                API.sendChat(subChat(arkhamBot.chat.langerror, {link: "http://git.io/vJ9nI"}));
                            }
                            else {
                                arkhamBot.settings.language = argument;
                                loadChat();
                                API.sendChat(subChat(arkhamBot.chat.langset, {language: arkhamBot.settings.language}));
                            }
                        });
                    }
                }
            },

            leaveCommand: {
                command: 'leave',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var ind = arkhamBot.room.roulette.participants.indexOf(chat.uid);
                        if (ind > -1) {
                            arkhamBot.room.roulette.participants.splice(ind, 1);
                            API.sendChat(subChat(arkhamBot.chat.rouletteleave, {name: chat.un}));
                        }
                    }
                }
            },

            linkCommand: {
                command: 'link',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var media = API.getMedia();
                        var from = chat.un;
                        var user = arkhamBot.userUtilities.lookupUser(chat.uid);
                        var perm = arkhamBot.userUtilities.getPermission(chat.uid);
                        var dj = API.getDJ().id;
                        var isDj = false;
                        if (dj === chat.uid) isDj = true;
                        if (perm >= 1 || isDj) {
                            if (media.format === 1) {
                                var linkToSong = "https://youtu.be/" + media.cid;
                                API.sendChat(subChat(arkhamBot.chat.songlink, {name: from, link: linkToSong}));
                            }
                            if (media.format === 2) {
                                SC.get('/tracks/' + media.cid, function (sound) {
                                    API.sendChat(subChat(arkhamBot.chat.songlink, {name: from, link: sound.permalink_url}));
                                });
                            }
                        }
                    }
                }
            },

            lockCommand: {
                command: 'lock',
                rank: 'mod',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        arkhamBot.roomUtilities.booth.lockBooth();
                    }
                }
            },

            lockdownCommand: {
                command: 'lockdown',
                rank: 'mod',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var temp = arkhamBot.settings.lockdownEnabled;
                        arkhamBot.settings.lockdownEnabled = !temp;
                        if (arkhamBot.settings.lockdownEnabled) {
                            return API.sendChat(subChat(arkhamBot.chat.toggleon, {name: chat.un, 'function': arkhamBot.chat.lockdown}));
                        }
                        else return API.sendChat(subChat(arkhamBot.chat.toggleoff, {name: chat.un, 'function': arkhamBot.chat.lockdown}));
                    }
                }
            },

            lockguardCommand: {
                command: 'lockguard',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (arkhamBot.settings.lockGuard) {
                            arkhamBot.settings.lockGuard = !arkhamBot.settings.lockGuard;
                            return API.sendChat(subChat(arkhamBot.chat.toggleoff, {name: chat.un, 'function': arkhamBot.chat.lockguard}));
                        }
                        else {
                            arkhamBot.settings.lockGuard = !arkhamBot.settings.lockGuard;
                            return API.sendChat(subChat(arkhamBot.chat.toggleon, {name: chat.un, 'function': arkhamBot.chat.lockguard}));
                        }
                    }
                }
            },

            lockskipCommand: {
                command: 'lockskip',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (arkhamBot.room.skippable) {
                            var dj = API.getDJ();
                            var id = dj.id;
                            var name = dj.username;
                            var msgSend = '@' + name + ': ';
                            arkhamBot.room.queueable = false;

                            if (chat.message.length === cmd.length) {
                                API.sendChat(subChat(arkhamBot.chat.usedlockskip, {name: chat.un}));
                                arkhamBot.roomUtilities.booth.lockBooth();
                                setTimeout(function (id) {
                                    API.moderateForceSkip();
                                    arkhamBot.room.skippable = false;
                                    setTimeout(function () {
                                        arkhamBot.room.skippable = true
                                    }, 5 * 1000);
                                    setTimeout(function (id) {
                                        arkhamBot.userUtilities.moveUser(id, arkhamBot.settings.lockskipPosition, false);
                                        arkhamBot.room.queueable = true;
                                        setTimeout(function () {
                                            arkhamBot.roomUtilities.booth.unlockBooth();
                                        }, 1000);
                                    }, 1500, id);
                                }, 1000, id);
                                return void (0);
                            }
                            var validReason = false;
                            var msg = chat.message;
                            var reason = msg.substring(cmd.length + 1);
                            for (var i = 0; i < arkhamBot.settings.lockskipReasons.length; i++) {
                                var r = arkhamBot.settings.lockskipReasons[i][0];
                                if (reason.indexOf(r) !== -1) {
                                    validReason = true;
                                    msgSend += arkhamBot.settings.lockskipReasons[i][1];
                                }
                            }
                            if (validReason) {
                                API.sendChat(subChat(arkhamBot.chat.usedlockskip, {name: chat.un}));
                                arkhamBot.roomUtilities.booth.lockBooth();
                                setTimeout(function (id) {
                                    API.moderateForceSkip();
                                    arkhamBot.room.skippable = false;
                                    API.sendChat(msgSend);
                                    setTimeout(function () {
                                        arkhamBot.room.skippable = true
                                    }, 5 * 1000);
                                    setTimeout(function (id) {
                                        arkhamBot.userUtilities.moveUser(id, arkhamBot.settings.lockskipPosition, false);
                                        arkhamBot.room.queueable = true;
                                        setTimeout(function () {
                                            arkhamBot.roomUtilities.booth.unlockBooth();
                                        }, 1000);
                                    }, 1500, id);
                                }, 1000, id);
                                return void (0);
                            }
                        }
                    }
                }
            },

            locktimerCommand: {
                command: 'locktimer',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var lockTime = msg.substring(cmd.length + 1);
                        if (!isNaN(lockTime) && lockTime !== "") {
                            arkhamBot.settings.maximumLocktime = lockTime;
                            return API.sendChat(subChat(arkhamBot.chat.lockguardtime, {name: chat.un, time: arkhamBot.settings.maximumLocktime}));
                        }
                        else return API.sendChat(subChat(arkhamBot.chat.invalidtime, {name: chat.un}));
                    }
                }
            },

            logoutCommand: {
                command: 'logout',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat(subChat(arkhamBot.chat.logout, {name: chat.un, botname: arkhamBot.settings.botName}));
                        setTimeout(function () {
                            $(".logout").mousedown()
                        }, 1000);
                    }
                }
            },

            maxlengthCommand: {
                command: 'maxlength',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var maxTime = msg.substring(cmd.length + 1);
                        if (!isNaN(maxTime)) {
                            arkhamBot.settings.maximumSongLength = maxTime;
                            return API.sendChat(subChat(arkhamBot.chat.maxlengthtime, {name: chat.un, time: arkhamBot.settings.maximumSongLength}));
                        }
                        else return API.sendChat(subChat(arkhamBot.chat.invalidtime, {name: chat.un}));
                    }
                }
            },

            motdCommand: {
                command: 'motd',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length <= cmd.length + 1) return API.sendChat('/me MotD: ' + arkhamBot.settings.motd);
                        var argument = msg.substring(cmd.length + 1);
                        if (!arkhamBot.settings.motdEnabled) arkhamBot.settings.motdEnabled = !arkhamBot.settings.motdEnabled;
                        if (isNaN(argument)) {
                            arkhamBot.settings.motd = argument;
                            API.sendChat(subChat(arkhamBot.chat.motdset, {msg: arkhamBot.settings.motd}));
                        }
                        else {
                            arkhamBot.settings.motdInterval = argument;
                            API.sendChat(subChat(arkhamBot.chat.motdintervalset, {interval: arkhamBot.settings.motdInterval}));
                        }
                    }
                }
            },

            moveCommand: {
                command: 'move',
                rank: 'mod',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(arkhamBot.chat.nouserspecified, {name: chat.un}));
                        var firstSpace = msg.indexOf(' ');
                        var lastSpace = msg.lastIndexOf(' ');
                        var pos;
                        var name;
                        if (isNaN(parseInt(msg.substring(lastSpace + 1)))) {
                            pos = 1;
                            name = msg.substring(cmd.length + 2);
                        }
                        else {
                            pos = parseInt(msg.substring(lastSpace + 1));
                            name = msg.substring(cmd.length + 2, lastSpace);
                        }
                        var user = arkhamBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(arkhamBot.chat.invaliduserspecified, {name: chat.un}));
                        if (user.id === arkhamBot.loggedInID) return API.sendChat(subChat(arkhamBot.chat.addbotwaitlist, {name: chat.un}));
                        if (!isNaN(pos)) {
                            API.sendChat(subChat(arkhamBot.chat.move, {name: chat.un}));
                            arkhamBot.userUtilities.moveUser(user.id, pos, false);
                        } else return API.sendChat(subChat(arkhamBot.chat.invalidpositionspecified, {name: chat.un}));
                    }
                }
            },

            muteCommand: {
                command: 'mute',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(arkhamBot.chat.nouserspecified, {name: chat.un}));
                        var lastSpace = msg.lastIndexOf(' ');
                        var time = null;
                        var name;
                        if (lastSpace === msg.indexOf(' ')) {
                            name = msg.substring(cmd.length + 2);
                            time = 45;
                        } else {
                            time = msg.substring(lastSpace + 1);
                            if (isNaN(time) || time == '' || time == null || typeof time == 'undefined'){
                                return API.sendChat(subChat(arkhamBot.chat.invalidtime, {name: chat.un}));
                            }
                            name = msg.substring(cmd.length + 2, lastSpace);
                        }
                        var from = chat.un;
                        var user = arkhamBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat(arkhamBot.chat.invaliduserspecified, {name: chat.un}));
                        var permFrom = arkhamBot.userUtilities.getPermission(chat.uid);
                        var permUser = arkhamBot.userUtilities.getPermission(user.id);
                        if (permUser == 0) {
                            if (time > 45) {
                                API.moderateMuteUser(user.id, 1, API.MUTE.LONG);
                                API.sendChat(subChat(arkhamBot.chat.mutedmaxtime, {name: chat.un, time: '45'}));
                            }
                            else if (time === 45) {
                                API.moderateMuteUser(user.id, 1, API.MUTE.LONG);
                                API.sendChat(subChat(arkhamBot.chat.mutedtime, {name: chat.un, username: name, time: time}));
                            }
                            else if (time > 30) {
                                API.moderateMuteUser(user.id, 1, API.MUTE.LONG);
                                API.sendChat(subChat(arkhamBot.chat.mutedtime, {name: chat.un, username: name, time: time}));
                            }
                            else if (time > 15) {
                                API.moderateMuteUser(user.id, 1, API.MUTE.MEDIUM);
                                API.sendChat(subChat(arkhamBot.chat.mutedtime, {name: chat.un, username: name, time: time}));
                            }
                            else {
                                API.moderateMuteUser(user.id, 1, API.MUTE.SHORT);
                                API.sendChat(subChat(arkhamBot.chat.mutedtime, {name: chat.un, username: name, time: time}));
                            }
                        }
                        else API.sendChat(subChat(arkhamBot.chat.muterank, {name: chat.un}));
                    }
                }
            },

            opCommand: {
                command: 'op',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (typeof arkhamBot.settings.opLink === "string")
                            return API.sendChat(subChat(arkhamBot.chat.oplist, {link: arkhamBot.settings.opLink}));
                    }
                }
            },

            pingCommand: {
                command: 'ping',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat(arkhamBot.chat.pong)
                    }
                }
            },

            refreshCommand: {
                command: 'refresh',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        //sendToSocket();
                        storeToStorage();
                        arkhamBot.disconnectAPI();
                        setTimeout(function () {
                            window.location.reload(false);
                        }, 1000);

                    }
                }
            },

            reloadCommand: {
                command: 'reload',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat(arkhamBot.chat.reload);
                        //sendToSocket();
                        storeToStorage();
                        arkhamBot.disconnectAPI();
                        kill();
                        setTimeout(function () {
                            $.getScript(arkhamBot.settings.scriptLink);
                        }, 2000);
                    }
                }
            },

            removeCommand: {
                command: 'remove',
                rank: 'mod',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length > cmd.length + 2) {
                            var name = msg.substr(cmd.length + 2);
                            var user = arkhamBot.userUtilities.lookupUserName(name);
                            if (typeof user !== 'boolean') {
                                user.lastDC = {
                                    time: null,
                                    position: null,
                                    songCount: 0
                                };
                                if (API.getDJ().id === user.id) {
                                    API.moderateForceSkip();
                                    setTimeout(function () {
                                        API.moderateRemoveDJ(user.id);
                                    }, 1 * 1000, user);
                                }
                                else API.moderateRemoveDJ(user.id);
                            } else API.sendChat(subChat(arkhamBot.chat.removenotinwl, {name: chat.un, username: name}));
                        } else API.sendChat(subChat(arkhamBot.chat.nouserspecified, {name: chat.un}));
                    }
                }
            },

            restrictetaCommand: {
                command: 'restricteta',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (arkhamBot.settings.etaRestriction) {
                            arkhamBot.settings.etaRestriction = !arkhamBot.settings.etaRestriction;
                            return API.sendChat(subChat(arkhamBot.chat.toggleoff, {name: chat.un, 'function': arkhamBot.chat.etarestriction}));
                        }
                        else {
                            arkhamBot.settings.etaRestriction = !arkhamBot.settings.etaRestriction;
                            return API.sendChat(subChat(arkhamBot.chat.toggleon, {name: chat.un, 'function': arkhamBot.chat.etarestriction}));
                        }
                    }
                }
            },

            rouletteCommand: {
                command: 'roulette',
                rank: 'mod',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (!arkhamBot.room.roulette.rouletteStatus) {
                            arkhamBot.room.roulette.startRoulette();
                        }
                    }
                }
            },

            rulesCommand: {
                command: 'rules',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (typeof arkhamBot.settings.rulesLink === "string")
                            return API.sendChat(subChat(arkhamBot.chat.roomrules, {link: arkhamBot.settings.rulesLink}));
                    }
                }
            },

            sessionstatsCommand: {
                command: 'sessionstats',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var from = chat.un;
                        var woots = arkhamBot.room.roomstats.totalWoots;
                        var mehs = arkhamBot.room.roomstats.totalMehs;
                        var grabs = arkhamBot.room.roomstats.totalCurates;
                        API.sendChat(subChat(arkhamBot.chat.sessionstats, {name: from, woots: woots, mehs: mehs, grabs: grabs}));
                    }
                }
            },

            skipCommand: {
                command: ['skip', 'smartskip'],
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (arkhamBot.room.skippable) {

                            var timeLeft = API.getTimeRemaining();
                            var timeElapsed = API.getTimeElapsed();
                            var dj = API.getDJ();
                            var name = dj.username;
                            var msgSend = '@' + name + ', ';

                            if (chat.message.length === cmd.length) {
                                API.sendChat(subChat(arkhamBot.chat.usedskip, {name: chat.un}));
                                if (arkhamBot.settings.smartSkip && timeLeft > timeElapsed){
                                    arkhamBot.roomUtilities.smartSkip();
                                }
                                else {
                                    API.moderateForceSkip();
                                }
                            }
                            var validReason = false;
                            var msg = chat.message;
                            var reason = msg.substring(cmd.length + 1);
                            for (var i = 0; i < arkhamBot.settings.skipReasons.length; i++) {
                                var r = arkhamBot.settings.skipReasons[i][0];
                                if (reason.indexOf(r) !== -1) {
                                    validReason = true;
                                    msgSend += arkhamBot.settings.skipReasons[i][1];
                                }
                            }
                            if (validReason) {
                                API.sendChat(subChat(arkhamBot.chat.usedskip, {name: chat.un}));
                                if (arkhamBot.settings.smartSkip && timeLeft > timeElapsed){
                                    arkhamBot.roomUtilities.smartSkip(msgSend);
                                }
                                else {
                                    API.moderateForceSkip();
                                    setTimeout(function () {
                                        API.sendChat(msgSend);
                                    }, 500);
                                }
                            }
                        }
                    }
                }
            },

            skipposCommand: {
                command: 'skippos',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var pos = msg.substring(cmd.length + 1);
                        if (!isNaN(pos)) {
                            arkhamBot.settings.skipPosition = pos;
                            return API.sendChat(subChat(arkhamBot.chat.skippos, {name: chat.un, position: arkhamBot.settings.skipPosition}));
                        }
                        else return API.sendChat(subChat(arkhamBot.chat.invalidpositionspecified, {name: chat.un}));
                    }
                }
            },

            songstatsCommand: {
                command: 'songstats',
                rank: 'mod',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (arkhamBot.settings.songstats) {
                            arkhamBot.settings.songstats = !arkhamBot.settings.songstats;
                            return API.sendChat(subChat(arkhamBot.chat.toggleoff, {name: chat.un, 'function': arkhamBot.chat.songstats}));
                        }
                        else {
                            arkhamBot.settings.songstats = !arkhamBot.settings.songstats;
                            return API.sendChat(subChat(arkhamBot.chat.toggleon, {name: chat.un, 'function': arkhamBot.chat.songstats}));
                        }
                    }
                }
            },

            sourceCommand: {
                command: 'source',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat('/me This bot was created by ' + botCreator + ', but is now maintained by ' + botMaintainer + ".");
                    }
                }
            },

            statusCommand: {
                command: 'status',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var from = chat.un;
                        var msg = '[@' + from + '] ';

                        msg += arkhamBot.chat.afkremoval + ': ';
                        if (arkhamBot.settings.afkRemoval) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';
                        msg += arkhamBot.chat.afksremoved + ": " + arkhamBot.room.afkList.length + '. ';
                        msg += arkhamBot.chat.afklimit + ': ' + arkhamBot.settings.maximumAfk + '. ';

                        msg += 'Bouncer+: ';
                        if (arkhamBot.settings.bouncerPlus) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += arkhamBot.chat.blacklist + ': ';
                        if (arkhamBot.settings.blacklistEnabled) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += arkhamBot.chat.lockguard + ': ';
                        if (arkhamBot.settings.lockGuard) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += arkhamBot.chat.cycleguard + ': ';
                        if (arkhamBot.settings.cycleGuard) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += arkhamBot.chat.timeguard + ': ';
                        if (arkhamBot.settings.timeGuard) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += arkhamBot.chat.chatfilter + ': ';
                        if (arkhamBot.settings.filterChat) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += arkhamBot.chat.historyskip + ': ';
                        if (arkhamBot.settings.historySkip) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += arkhamBot.chat.voteskip + ': ';
                        if (arkhamBot.settings.voteSkip) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += arkhamBot.chat.cmddeletion + ': ';
                        if (arkhamBot.settings.cmdDeletion) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += arkhamBot.chat.autoskip + ': ';
                        if (arkhamBot.settings.autoskip) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        // TODO: Display more toggleable bot settings.

                        var launchT = arkhamBot.room.roomstats.launchTime;
                        var durationOnline = Date.now() - launchT;
                        var since = arkhamBot.roomUtilities.msToStr(durationOnline);
                        msg += subChat(arkhamBot.chat.activefor, {time: since});

                        /*
                        // least efficient way to go about this, but it works :)
                        if (msg.length > 250){
                            firstpart = msg.substr(0, 250);
                            secondpart = msg.substr(250);
                            API.sendChat(firstpart);
                            setTimeout(function () {
                                API.sendChat(secondpart);
                            }, 300);
                        }
                        else {
                            API.sendChat(msg);
                        }
                        */

                        // This is a more efficient solution
                        if (msg.length > 250){
                            var split = msg.match(/.{1,250}/g);
                            for (var i = 0; i < split.length; i++) {
                                var func = function(index) {
                                    setTimeout(function() {
                                        API.sendChat("/me " + split[index]);
                                    }, 500 * index);
                                }
                                func(i);
                            }
                        }
                        else {
                            return API.sendChat(msg);
                        }
                    }
                }
            },

            swapCommand: {
                command: 'swap',
                rank: 'mod',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(arkhamBot.chat.nouserspecified, {name: chat.un}));
                        var firstSpace = msg.indexOf(' ');
                        var lastSpace = msg.lastIndexOf(' ');
                        var name1 = msg.split('@')[1].trim();
                        var name2 = msg.split('@')[2].trim();
                        var user1 = arkhamBot.userUtilities.lookupUserName(name1);
                        var user2 = arkhamBot.userUtilities.lookupUserName(name2);
                        if (typeof user1 === 'boolean' || typeof user2 === 'boolean') return API.sendChat(subChat(arkhamBot.chat.swapinvalid, {name: chat.un}));
                        if (user1.id === arkhamBot.loggedInID || user2.id === arkhamBot.loggedInID) return API.sendChat(subChat(arkhamBot.chat.addbottowaitlist, {name: chat.un}));
                        var p1 = API.getWaitListPosition(user1.id) + 1;
                        var p2 = API.getWaitListPosition(user2.id) + 1;
                        if (p1 < 0 && p2 < 0) return API.sendChat(subChat(arkhamBot.chat.swapwlonly, {name: chat.un}));
                        API.sendChat(subChat(arkhamBot.chat.swapping, {'name1': name1, 'name2': name2}));
                        if (p1 === -1){
                            API.moderateRemoveDJ(user2.id);
                            setTimeout(function (user1, p2) {
                                arkhamBot.userUtilities.moveUser(user1.id, p2, true);
                            }, 2000, user1, p2);
                        }
                        else if (p2 === -1){
                            API.moderateRemoveDJ(user1.id);
                            setTimeout(function (user2, p1) {
                                arkhamBot.userUtilities.moveUser(user2.id, p1, true);
                            }, 2000, user2, p1);
                        }
                        else if (p1 < p2) {
                            arkhamBot.userUtilities.moveUser(user2.id, p1, false);
                            setTimeout(function (user1, p2) {
                                arkhamBot.userUtilities.moveUser(user1.id, p2, false);
                            }, 2000, user1, p2);
                        }
                        else {
                            arkhamBot.userUtilities.moveUser(user1.id, p2, false);
                            setTimeout(function (user2, p1) {
                                arkhamBot.userUtilities.moveUser(user2.id, p1, false);
                            }, 2000, user2, p1);
                        }
                    }
                }
            },

            themeCommand: {
                command: 'theme',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (typeof arkhamBot.settings.themeLink === "string")
                            API.sendChat(subChat(arkhamBot.chat.genres, {link: arkhamBot.settings.themeLink}));
                    }
                }
            },

            thorCommand: {
              command: 'thor',
              rank: 'user',
              type: 'exact',
              functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                      if (arkhamBot.settings.thorCommand){
                        var id = chat.uid,
                              isDj = API.getDJ().id == id ? true : false,
                              from = chat.un,
                              djlist = API.getWaitList(),
                              inDjList = false,
                              oldTime = 0,
                              usedThor = false,
                              indexArrUsedThor,
                              thorCd = false,
                              timeInMinutes = 0,
                              worthyAlg = Math.floor(Math.random() * 10),
                              worthy = worthyAlg == 10 ? true : false;

                          for (var i = 0; i < djlist.length; i++) {
                              if (djlist[i].id == id)
                                  inDjList = true;
                          }

                          if (inDjList) {
                              for (var i = 0; i < arkhamBot.room.usersUsedThor.length; i++) {
                                  if (arkhamBot.room.usersUsedThor[i].id == id) {
                                      oldTime = arkhamBot.room.usersUsedThor[i].time;
                                      usedThor = true;
                                      indexArrUsedThor = i;
                                  }
                              }

                              if (usedThor) {
                                  timeInMinutes = (arkhamBot.settings.thorCooldown + 1) - (Math.floor((oldTime - Date.now()) * Math.pow(10, -5)) * -1);
                                  thorCd = timeInMinutes > 0 ? true : false;
                                  if (thorCd == false)
                                      arkhamBot.room.usersUsedThor.splice(indexArrUsedThor, 1);
                              }

                              if (thorCd == false || usedThor == false) {
                                  var user = {id: id, time: Date.now()};
                                  arkhamBot.room.usersUsedThor.push(user);
                              }
                          }

                          if (!inDjList) {
                              return API.sendChat(subChat(arkhamBot.chat.thorNotClose, {name: from}));
                          } else if (thorCd) {
                              return API.sendChat(subChat(arkhamBot.chat.thorcd, {name: from, time: timeInMinutes}));
                          }

                          if (worthy) {
                            if (API.getWaitListPosition(id) != 0)
                            arkhamBot.userUtilities.moveUser(id, 1, false);
                            API.sendChat(subChat(arkhamBot.chat.thorWorthy, {name: from}));
                          } else {
                            if (API.getWaitListPosition(id) != djlist.length - 1)
                            arkhamBot.userUtilities.moveUser(id, djlist.length, false);
                            API.sendChat(subChat(arkhamBot.chat.thorNotWorthy, {name: from}));
                          }
                        }
                    }
                }
            },

            timeguardCommand: {
                command: 'timeguard',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (arkhamBot.settings.timeGuard) {
                            arkhamBot.settings.timeGuard = !arkhamBot.settings.timeGuard;
                            return API.sendChat(subChat(arkhamBot.chat.toggleoff, {name: chat.un, 'function': arkhamBot.chat.timeguard}));
                        }
                        else {
                            arkhamBot.settings.timeGuard = !arkhamBot.settings.timeGuard;
                            return API.sendChat(subChat(arkhamBot.chat.toggleon, {name: chat.un, 'function': arkhamBot.chat.timeguard}));
                        }

                    }
                }
            },

            toggleblCommand: {
                command: 'togglebl',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var temp = arkhamBot.settings.blacklistEnabled;
                        arkhamBot.settings.blacklistEnabled = !temp;
                        if (arkhamBot.settings.blacklistEnabled) {
                          return API.sendChat(subChat(arkhamBot.chat.toggleon, {name: chat.un, 'function': arkhamBot.chat.blacklist}));
                        }
                        else return API.sendChat(subChat(arkhamBot.chat.toggleoff, {name: chat.un, 'function': arkhamBot.chat.blacklist}));
                    }
                }
            },

            togglemotdCommand: {
                command: 'togglemotd',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (arkhamBot.settings.motdEnabled) {
                            arkhamBot.settings.motdEnabled = !arkhamBot.settings.motdEnabled;
                            API.sendChat(subChat(arkhamBot.chat.toggleoff, {name: chat.un, 'function': arkhamBot.chat.motd}));
                        }
                        else {
                            arkhamBot.settings.motdEnabled = !arkhamBot.settings.motdEnabled;
                            API.sendChat(subChat(arkhamBot.chat.toggleon, {name: chat.un, 'function': arkhamBot.chat.motd}));
                        }
                    }
                }
            },

            togglevoteskipCommand: {
                command: 'togglevoteskip',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (arkhamBot.settings.voteSkip) {
                            arkhamBot.settings.voteSkip = !arkhamBot.settings.voteSkip;
                            API.sendChat(subChat(arkhamBot.chat.toggleoff, {name: chat.un, 'function': arkhamBot.chat.voteskip}));
                        }
                        else {
                            arkhamBot.settings.voteSkip = !arkhamBot.settings.voteSkip;
                            API.sendChat(subChat(arkhamBot.chat.toggleon, {name: chat.un, 'function': arkhamBot.chat.voteskip}));
                        }
                    }
                }
            },

            unbanCommand: {
                command: 'unban',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        $.getJSON('/_/bans', function (json){
                            var msg = chat.message;
                            if (msg.length === cmd.length) return;
                            var name = msg.substring(cmd.length + 2);
                            var bannedUsers = json.data;
                            var found = false;
                            var bannedUser = null;
                            for (var i = 0; i < bannedUsers.length; i++) {
                                var user = bannedUsers[i];
                                if (user.username === name) {
                                    bannedUser = user;
                                    found = true;
                                }
                            }
                            if (!found) return API.sendChat(subChat(arkhamBot.chat.notbanned, {name: chat.un}));
                            API.moderateUnbanUser(bannedUser.id);
                            console.log('Unbanned:', name);
                        });
                    }
                }
            },

            unlockCommand: {
                command: 'unlock',
                rank: 'mod',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        arkhamBot.roomUtilities.booth.unlockBooth();
                    }
                }
            },

            unmuteCommand: {
                command: 'unmute',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        $.getJSON('/_/mutes', function (json){
                            var msg = chat.message;
                            if (msg.length === cmd.length) return;
                            var name = msg.substring(cmd.length+2);
                            var arg = msg.substring(cmd.length+1);
                            var mutedUsers = json.data;
                            var found = false;
                            var mutedUser = null;
                            var permFrom = arkhamBot.userUtilities.getPermission(chat.uid);
                            if (msg.indexOf('@') === -1 && arg === 'all'){
                                if (permFrom > 2){
                                    for (var i = 0; i < mutedUsers.length; i++){
                                        API.moderateUnmuteUser(mutedUsers[i].id);
                                    }
                                    API.sendChat(subChat(arkhamBot.chat.unmutedeveryone, {name: chat.un}));
                                } else API.sendChat(subChat(arkhamBot.chat.unmuteeveryonerank, {name: chat.un}));
                            } else {
                                for (var i = 0; i < mutedUsers.length; i++){
                                    var user = mutedUsers[i];
                                    if (user.username === name){
                                        mutedUser = user;
                                        found = true;
                                    }
                                }
                                if (!found) return API.sendChat(subChat(arkhamBot.chat.notbanned, {name: chat.un}));
                                API.moderateUnmuteUser(mutedUser.id);
                                console.log('Unmuted:', name);
                            }
                        });
                    }
                }
            },

            usercmdcdCommand: {
                command: 'usercmdcd',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var cd = msg.substring(cmd.length + 1);
                        if (!isNaN(cd)) {
                            arkhamBot.settings.commandCooldown = cd;
                            return API.sendChat(subChat(arkhamBot.chat.commandscd, {name: chat.un, time: arkhamBot.settings.commandCooldown}));
                        }
                        else return API.sendChat(subChat(arkhamBot.chat.invalidtime, {name: chat.un}));
                    }
                }
            },

           usercommandsCommand: {
                command: 'usercommands',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (arkhamBot.settings.usercommandsEnabled) {
                            API.sendChat(subChat(arkhamBot.chat.toggleoff, {name: chat.un, 'function': arkhamBot.chat.usercommands}));
                            arkhamBot.settings.usercommandsEnabled = !arkhamBot.settings.usercommandsEnabled;
                        }
                        else {
                            API.sendChat(subChat(arkhamBot.chat.toggleon, {name: chat.un, 'function': arkhamBot.chat.usercommands}));
                            arkhamBot.settings.usercommandsEnabled = !arkhamBot.settings.usercommandsEnabled;
                        }
                    }
                }
            },

            voteratioCommand: {
                command: 'voteratio',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat(arkhamBot.chat.nouserspecified, {name: chat.un}));
                        var name = msg.substring(cmd.length + 2);
                        var user = arkhamBot.userUtilities.lookupUserName(name);
                        if (user === false) return API.sendChat(subChat(arkhamBot.chat.invaliduserspecified, {name: chat.un}));
                        var vratio = user.votes;
                        var ratio = vratio.woot / vratio.meh;
                        API.sendChat(subChat(arkhamBot.chat.voteratio, {name: chat.un, username: name, woot: vratio.woot, mehs: vratio.meh, ratio: ratio.toFixed(2)}));
                    }
                }
            },

            voteskipCommand: {
                command: 'voteskip',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length <= cmd.length + 1) return API.sendChat(subChat(arkhamBot.chat.voteskiplimit, {name: chat.un, limit: arkhamBot.settings.voteSkipLimit}));
                        var argument = msg.substring(cmd.length + 1);
                        if (!arkhamBot.settings.voteSkip) arkhamBot.settings.voteSkip = !arkhamBot.settings.voteSkip;
                        if (isNaN(argument)) {
                            API.sendChat(subChat(arkhamBot.chat.voteskipinvalidlimit, {name: chat.un}));
                        }
                        else {
                            arkhamBot.settings.voteSkipLimit = argument;
                            API.sendChat(subChat(arkhamBot.chat.voteskipsetlimit, {name: chat.un, limit: arkhamBot.settings.voteSkipLimit}));
                        }
                    }
                }
            },

            welcomeCommand: {
                command: 'welcome',
                rank: 'mod',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (arkhamBot.settings.welcome) {
                            arkhamBot.settings.welcome = !arkhamBot.settings.welcome;
                            return API.sendChat(subChat(arkhamBot.chat.toggleoff, {name: chat.un, 'function': arkhamBot.chat.welcomemsg}));
                        }
                        else {
                            arkhamBot.settings.welcome = !arkhamBot.settings.welcome;
                            return API.sendChat(subChat(arkhamBot.chat.toggleon, {name: chat.un, 'function': arkhamBot.chat.welcomemsg}));
                        }
                    }
                }
            },

            websiteCommand: {
                command: 'website',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (typeof arkhamBot.settings.website === "string")
                            API.sendChat(subChat(arkhamBot.chat.website, {link: arkhamBot.settings.website}));
                    }
                }
            },

            whoisCommand: {
                command: 'whois',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var name;
                        if (msg.length === cmd.length) name = chat.un;
                        else {
                            name = msg.substr(cmd.length + 2);
                        }
                        users = API.getUsers();
                        var len = users.length;
                        for (var i = 0; i < len; ++i){
                            if (users[i].username == name){
                                var id = users[i].id;
                                var avatar = API.getUser(id).avatarID;
                                var level = API.getUser(id).level;
                                var rawjoined = API.getUser(id).joined;
                                var joined = rawjoined.substr(0, 10);
                                var rawlang = API.getUser(id).language;
                                if (rawlang == "en"){
                                    var language = "English";
                                } else if (rawlang == "bg"){
                                    var language = "Bulgarian";
                                } else if (rawlang == "cs"){
                                    var language = "Czech";
                                } else if (rawlang == "fi"){
                                    var language = "Finnish"
                                } else if (rawlang == "fr"){
                                    var language = "French"
                                } else if (rawlang == "pt"){
                                    var language = "Portuguese"
                                } else if (rawlang == "zh"){
                                    var language = "Chinese"
                                } else if (rawlang == "sk"){
                                    var language = "Slovak"
                                } else if (rawlang == "nl"){
                                    var language = "Dutch"
                                } else if (rawlang == "ms"){
                                    var language = "Malay"
                                }
                                var rawrank = API.getUser(id).role;
                                if (rawrank == "0"){
                                    var rank = "User";
                                } else if (rawrank == "1"){
                                    var rank = "Resident DJ";
                                } else if (rawrank == "2"){
                                    var rank = "Bouncer";
                                } else if (rawrank == "3"){
                                    var rank = "Manager"
                                } else if (rawrank == "4"){
                                    var rank = "Co-Host"
                                } else if (rawrank == "5"){
                                    var rank = "Host"
                                } else if (rawrank == "7"){
                                    var rank = "Brand Ambassador"
                                } else if (rawrank == "10"){
                                    var rank = "Admin"
                                }
                                var slug = API.getUser(id).slug;
                                if (typeof slug !== 'undefined') {
                                    var profile = "https://plug.dj/@/" + slug;
                                } else {
                                    var profile = "~";
                                }

                                API.sendChat(subChat(arkhamBot.chat.whois, {name1: chat.un, name2: name, id: id, avatar: avatar, profile: profile, language: language, level: level, joined: joined, rank: rank}));
                            }
                        }
                    }
                }
            },

            youtubeCommand: {
                command: 'youtube',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!arkhamBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (typeof arkhamBot.settings.youtubeLink === "string")
                            API.sendChat(subChat(arkhamBot.chat.youtube, {name: chat.un, link: arkhamBot.settings.youtubeLink}));
                    }
                }
            }
        }
    };

    loadChat(arkhamBot.startup);
}).call(this);			
