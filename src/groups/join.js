'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
/* eslint-disable import/no-import-module-exports */
const winston = require("winston");
/* eslint-disable import/no-import-module-exports */
const database_1 = __importDefault(require("../database"));
/* eslint-disable import/no-import-module-exports */
const user_1 = __importDefault(require("../user"));
/* eslint-disable import/no-import-module-exports */
const plugins_1 = __importDefault(require("../plugins"));
/* eslint-disable import/no-import-module-exports */
const cache_1 = __importDefault(require("../cache"));
function default_1(Groups) {
    Groups.join = function (groupNames, uid) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!groupNames) {
                throw new Error('[[error:invalid-data]]');
            }
            if (Array.isArray(groupNames) && !groupNames.length) {
                return;
            }
            if (!Array.isArray(groupNames)) {
                groupNames = [groupNames];
            }
            if (!uid) {
                throw new Error('[[error:invalid-uid]]');
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const [isMembers, exists, isAdmin] = yield Promise.all([
                Groups.isMemberOfGroups(uid, groupNames),
                Groups.exists(groupNames),
                user_1.default.isAdministrator(uid),
            ]);
            const groupsToCreate = groupNames.filter((groupName, index) => groupName && !exists[index]);
            const groupsToJoin = groupNames.filter((groupName, index) => !isMembers[index]);
            if (!groupsToJoin.length) {
                return;
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            yield createNonExistingGroups(groupsToCreate);
            const promises = [
                database_1.default.sortedSetsAdd(groupsToJoin.map(groupName => `group:${groupName}:members`), Date.now(), uid),
                database_1.default.incrObjectField(groupsToJoin.map(groupName => `group:${groupName}`), 'memberCount'),
            ];
            if (isAdmin) {
                promises.push(database_1.default.setsAdd(groupsToJoin.map(groupName => `group:${groupName}:owners`), uid));
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            yield Promise.all(promises);
            Groups.clearCache(uid, groupsToJoin);
            cache_1.default.del(groupsToJoin.map(name => `group:${name}:members`));
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const groupData = yield Groups.getGroupsFields(groupsToJoin, ['name', 'hidden', 'memberCount']);
            const visibleGroups = groupData.filter((groupData) => groupData && !groupData.hidden);
            if (visibleGroups.length) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                yield database_1.default.sortedSetAdd('groups:visible:memberCount', visibleGroups.map((groupData) => groupData.memberCount), visibleGroups.map((groupData) => groupData.name));
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            yield setGroupTitleIfNotSet(groupsToJoin, uid);
            plugins_1.default.hooks.fire('action:group.join', {
                groupNames: groupsToJoin,
                uid: uid,
            });
        });
    };
    function createNonExistingGroups(groupsToCreate) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!groupsToCreate.length) {
                return;
            }
            for (const groupName of groupsToCreate) {
                try {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                    // eslint-disable-next-line no-await-in-loop
                    yield Groups.create({
                        name: groupName,
                        hidden: 1,
                    });
                }
                catch (err) {
                    if (err && err.message !== '[[error:group-already-exists]]') {
                        winston.error(`[groups.join] Could not create new hidden group (${groupName})\n${err.stack}`);
                        throw err;
                    }
                }
            }
        });
    }
    function setGroupTitleIfNotSet(groupNames, uid) {
        return __awaiter(this, void 0, void 0, function* () {
            const ignore = ['registered-users', 'verified-users', 'unverified-users', Groups.BANNED_USERS];
            groupNames = groupNames.filter(groupName => !ignore.includes(groupName) && !Groups.isPrivilegeGroup(groupName));
            if (!groupNames.length) {
                return;
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const currentTitle = yield database_1.default.getObjectField(`user:${uid}`, 'groupTitle');
            if (currentTitle || currentTitle === '') {
                return;
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            yield user_1.default.setUserField(uid, 'groupTitle', JSON.stringify(groupNames));
        });
    }
}
;
