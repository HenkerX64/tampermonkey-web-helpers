// ==UserScript==
// @name         OttPlayer - TV Playlist Organizer
// @name:ru      OttPlayer - Органайзер ТВ-плейлиста
// @namespace    https://github.com/HenkerX64
// @version      1.1
// @description  Organizes an OttPlayer playlist on its edit page: library icons and EPG, 18+ locks, group moves, and a memory of every decision, so the next playlist of the same provider takes one click.
// @description:ru  Упорядочивает плейлист OttPlayer прямо на странице редактирования: иконки и EPG из библиотеки, замки 18+, перенос по группам и память решений — следующий плейлист того же провайдера в один клик.
// @author       HenkerX64
// @homepage     https://github.com/HenkerX64/tampermonkey-web-helpers
// @supportURL   https://github.com/HenkerX64/tampermonkey-web-helpers/issues
// @downloadURL  https://raw.githubusercontent.com/HenkerX64/tampermonkey-web-helpers/main/ottplayer/ottplayerTvPlaylistOrganizer.user.js
// @updateURL    https://raw.githubusercontent.com/HenkerX64/tampermonkey-web-helpers/main/ottplayer/ottplayerTvPlaylistOrganizer.user.js
// @match        https://ottplayer.tv/playlist/edit/*
// @icon         https://ottplayer.tv/public/images/favicon.png
// @connect      *
// @grant        GM_xmlhttpRequest
// @run-at       document-idle
// ==/UserScript==

/**
 * README (English):
 * Organizes an OttPlayer playlist right on its edit page.
 * - Every channel gets its library icon, a picker that searches OttPlayer's channel library word by word
 *   (Cyrillic and Latin spellings find each other), an 18+ lock and a "move to another group" button.
 *   An unbound channel shows "no channel" in place of its icon: one click binds it.
 * - The picker shows the channel's current binding above the results and ticks it in the list. It starts
 *   with the title cleaned for searching: without HD, SD, FHD, UHD, HDR, 4K, TV, "channel" and +2-style
 *   time shifts. What you type is searched as typed.
 * - Every group has one menu (⋮) of described actions: "lock all", "unlock all", "no channel" for its
 *   unbound channels (a channel without any binding has no timeline in the player, so its archive cannot
 *   be scrubbed), "dissolve" — move all its channels into another group, after a confirmation with their
 *   number, with progress and Stop — and "make favourite".
 * - Every channel of a group whose title contains "For Adults" or «Для взрослых» is locked (18+) when the page
 *   opens and after "Refresh list", since a playlist update brings a channel renamed at its source back
 *   without its lock. Nothing is ever unlocked, and a channel you unlocked yourself stays unlocked.
 * - One group per playlist can be the favourite: it is highlighted, and every channel shows a star. A click
 *   puts a copy of the channel into the favourite group, with its icon, EPG and 18+ lock, or takes that copy
 *   out again; the channel itself stays in its own group. The star is yellow when the favourite group holds a
 *   channel of exactly that title, and it stays inactive when several channels share the title. "Apply
 *   remembered" never takes a channel out of the favourite group.
 * - When OttPlayer updates the playlist from its source, it matches channels by their exact title: a channel
 *   renamed at the source is deleted and comes back as a new channel, without its 18+ lock or hand-chosen
 *   binding. Afterwards run "Synchronize", which learns the new titles, and "Apply remembered", which puts
 *   the lock and binding back by the channel code; then "Update the copies" in the favourite group's menu,
 *   since an update never changes the address of a copy.
 * - A channel is deleted without reloading the page.
 * - Every decision is remembered in the browser, under the channel title and under the channel code
 *   of its stream address (…/ch123/…), which survives a rename and tells channels of the same name apart.
 *   "Apply remembered" replays them on another playlist of the same provider. "Synchronize" loads the
 *   playlist source and records what the playlist already shows.
 * - "Export all", "ch map" and "Load file" move the data between browsers or into a repository.
 *   "Load file" also takes the .m3u playlist itself.
 *
 * README (Русский):
 * Упорядочивает плейлист OttPlayer прямо на странице его редактирования.
 * - У каждого канала — его иконка из библиотеки, поиск по библиотеке каналов OttPlayer по словам
 *   (кириллица и латиница находят друг друга), замок 18+ и кнопка переноса в другую группу.
 *   У непривязанного канала на месте иконки — «нет канала»: один клик, и он привязан.
 * - Поиск показывает текущую привязку канала над результатами и отмечает её в списке. Он начинается
 *   с названия, очищенного для поиска: без HD, SD, FHD, UHD, HDR, 4K, ТВ, «канал» и сдвигов вида +2.
 *   Введённое вами ищется как есть.
 * - У каждой группы одно меню (⋮) действий с описанием: «закрыть все», «открыть все», «нет канала» для
 *   непривязанных (у канала без привязки в плеере нет шкалы времени, и архив по нему не мотается),
 *   «размыть» — перенести все её каналы в другую группу, с подтверждением и числом каналов, с ходом
 *   работы и «Стоп», — и «сделать избранной».
 * - Все каналы группы, в названии которой есть «Для взрослых» или «For Adults», закрываются (18+) при открытии
 *   страницы и после «Обновить список»: обновление плейлиста возвращает переименованный в источнике канал
 *   без замка. Открывать скрипт ничего не будет, а канал, который вы открыли сами, останется открытым.
 * - Одна группа плейлиста может быть избранной: она выделена, а у каждого канала есть звезда. Клик кладёт
 *   копию канала в избранную группу — с его иконкой, EPG и замком 18+ — или убирает эту копию обратно; сам
 *   канал остаётся в своей группе. Звезда жёлтая, если в избранной группе есть канал точно с таким названием,
 *   и неактивна, если такое название у нескольких каналов. «Применить запомненное» никогда не уводит канал
 *   из избранной группы.
 * - Когда OttPlayer обновляет плейлист из источника, он сопоставляет каналы по точному названию: канал,
 *   переименованный в источнике, удаляется и появляется заново — без замка 18+ и выбранной вручную привязки.
 *   После обновления нажмите «Синхронизировать» — он узнает новые названия — и «Применить запомненное»,
 *   которое вернёт замок и привязку по коду канала, а затем «Обновить копии» в меню избранной группы:
 *   обновление никогда не меняет адрес копии.
 * - Канал удаляется без перезагрузки страницы.
 * - Каждое решение запоминается в браузере — по названию канала и по коду канала из адреса потока
 *   (…/ch123/…): код переживает переименование и различает каналы с одинаковым названием.
 *   «Применить запомненное» повторяет их на другом плейлисте того же провайдера. «Синхронизировать»
 *   загружает источник плейлиста и записывает то, что в плейлисте уже есть.
 * - «Выгрузить всё», «ch-карта» и «Загрузить файл» переносят данные между браузерами или в репозиторий.
 *   «Загрузить файл» принимает и сам плейлист .m3u.
 */

/**
 * @external unsafeWindow
 * @external GM_xmlhttpRequest
 * @external jQuery the page's own 3.3.1
 * @external jQuery.ui the page's own jQuery UI 1.11.2: menu, for the group menu
 * @external UIkit the page's own UIkit 3.0.0-rc.17: modal and notification, for the dissolve dialog and its result
 */

(function (pageWindow) {
    'use strict';

    const $ = pageWindow.jQuery;
    const PLAYLIST_ID = (location.pathname.match(/\/playlist\/edit\/(\d+)/) || [])[1];
    if (!$ || !PLAYLIST_ID) return;

    const ORIGIN = 'https://ottplayer.tv';
    const STORAGE_KEY = 'ott-mapper-v1';
    const NO_CHANNEL = '1';
    const SHARED_TITLE = '';
    const REQUEST_DELAY_MS = 160;
    const PICKER_LIMIT = 60;
    const LOG_LIMIT = 300;
    const DECORATE_THROTTLE_MS = 300;
    const ROWS_PER_SLICE = 50;
    const GROUP_SWITCH_REDECORATE_MS = [120, 400, 900, 1800];
    const ROW = '.channel_item[id]:not(.addch)';
    const OWN_UI = '#om-panel, .om-modal, .om-ui';
    const ADULT_GROUP = /для\s+взрослых|for\s+adults/i;

    const translations = {
        en: {
            panelTitle: 'Playlist organizer',
            collapse: 'collapse',
            profile: 'profile',
            profileHint: 'which set of remembered decisions this playlist uses',
            profileOption: '{name} — {byTitle} by title · {byCode} by ch',
            apply: 'Apply remembered',
            applyHint: 'whole playlist; Shift — the open group only, without asking',
            sync: 'Synchronize',
            syncHint: 'load the source, record the current bindings and locks as decisions; Shift — the playlist wins where they differ',
            buildLibrary: 'Collect library',
            buildLibraryHint: 'probes for the playlist titles; Shift — every letter pair',
            exportAll: 'Export all',
            exportCodes: 'ch map',
            exportCodesHint: 'ch → epg_id, for a repository',
            exportLibrary: 'Library only',
            import: 'Load file',
            importHint: '.json with decisions, or the .m3u playlist',
            refresh: 'Refresh list',
            diagnose: 'Diagnostics',
            stop: 'Stop',
            takeover: 'delete a channel without reloading',
            pick: 'icon',
            pickHint: 'choose icon and EPG',
            lockSet: 'set 18+',
            lockRemove: 'remove 18+',
            moveHint: 'move to another group',
            moveTo: 'move to…',
            groupMenuHint: 'group actions',
            groupLock: 'Lock all (18+)',
            groupLockHint: 'lock every channel of the group (18+)',
            groupUnlock: 'Unlock all',
            groupUnlockHint: 'unlock every channel of the group',
            groupNoChannel: '"No channel" for the unbound',
            groupNoChannelHint: 'unbound channels → "no channel" (id 1): without a binding there is no timeline and no archive',
            groupDissolve: 'Dissolve into another group…',
            groupDissolveHint: 'move every channel of this group into another one, after a confirmation with their number',
            groupFavourite: 'Make favourite',
            groupFavouriteHint: 'one group per playlist: every channel gets a star, yellow when it is in this group',
            groupUnfavourite: 'No longer favourite',
            groupUnfavouriteHint: 'the stars disappear; no channel is changed',
            adultGroupsLocked: 'groups for adults: {count} channels locked (18+)',
            groupUpdateCopies: 'Update the copies',
            groupUpdateCopiesHint: 'give every copy in this group its original\'s current address, binding and 18+: a playlist update changes the original\'s address, never the copy\'s',
            labelCopies: 'copies',
            copiesChecked: 'copies in «{group}»: {updated} of {count} updated from their originals, {left} left as they are',
            copiesLeft: 'left as they are in «{group}», because their title does not name exactly one original and one copy: {titles}',
            confirmUpdateCopies: 'Group «{group}»: give {count} copies the current address, binding and 18+ of their originals?',
            confirmLeaveFavourite: '«{group}» holds {count} copies of channels from other groups. Once it is no longer the favourite group they are ordinary channels: "Apply remembered" may move each one next to its original, and "Update the copies" no longer reaches them. Continue?',
            addressUpdated: 'new address',
            favouriteSet: '★ favourite group: «{group}»',
            favouriteCleared: 'no favourite group any more',
            labelFavourite: 'favourite',
            starAdd: 'add a copy of this channel to the favourite group «{group}»',
            starRemove: 'in «{group}»: remove the copy from there, the channel stays where it is',
            starAlone: '«{title}» is only in «{group}»: a channel that lives there, or a copy whose original was renamed or deleted — the star leaves it',
            starAmbiguous: 'several channels are called «{title}»: the star cannot tell which copy is whose',
            copyUnclear: 'one new row called like this was expected in «{group}», found {count}',
            copyUnfinished: '«{title}»: a copy in «{group}» may be left with the site\'s own binding and no 18+ — check it there, or run "Update the copies"',
            copyAlreadyThere: '«{title}» is in «{group}» already, so no second copy is made: the group\'s list is shown as the site has it',
            otherStream: '«{title}» in «{group}» plays another stream than the channel of the same title elsewhere: taken for no copy and left alone. If it is one, delete it with its trash link and set the star again',
            copyNotMoved: '«{title}» is not moved: the favourite group keeps exactly one copy of it',
            dissolveTitle: 'Dissolve «{group}»',
            dissolveTarget: 'move its channels to',
            dissolveChoose: '{count} channels are in «{from}». Choose the group that takes them.',
            dissolveCount: '{count} channels will move from «{from}» to «{to}».',
            dissolveConfirm: 'Move {count} channels',
            dissolveDone: '«{from}» → «{to}»: moved {moved} of {total}',
            groupEmpty: 'group «{group}» has no channels',
            labelDissolve: 'dissolve',
            cancel: 'Cancel',
            jqueryUiMissing: 'jQuery UI is not on this page: the group menu opens as a plain list, without keyboard control',
            uikitMissing: 'no UIkit modal on this page: the dissolve dialog opens in the organizer\'s own window',
            currentBinding: 'current binding',
            currentUnbound: 'not bound',
            headerProfile: 'profile {profile} · decisions {byTitle} by title, {byCode} by ch · library {library} · probes {probes}',
            headerGroup: 'group {total} of {all}, ch known for {withCode} · unbound {unbound} · "no channel" {noChannel} · 18+ {adult} · pending {pending}',
            searchPlaceholder: 'search the library…',
            noChannelButton: 'no channel (1)',
            noChannelHint: 'set "no channel"',
            noChannelName: 'no channel',
            close: 'close',
            pickerHint: 'library {library} · probes {probes}',
            pickerHintAdded: 'added from {probes}',
            requesting: 'requesting: {probes}…',
            typeToSearch: 'Type a word to search.',
            nothingFoundEvenFor: 'Nothing found, not even for "{word}".',
            relaxedQuery: 'Nothing for "{query}" — showing "{used}"',
            truncatedResults: 'Found {total}, showing the first {limit} — refine the query',
            stopping: 'stopping…',
            stopped: 'stopped',
            batchChanged: '{label}: changed {changed} of {total}',
            batchUnchanged: 'already so {count}',
            batchFailed: 'failed {count}',
            labelBinding: 'binding',
            labelMove: 'move',
            labelApply: 'applying',
            labelSearch: 'search',
            changeUnlocked: 'without 18+',
            noChannelsVisible: 'no channels visible — open the Channels tab',
            allAsRemembered: 'everything is as remembered: {known} of {total} channels {scope} have a decision',
            noTitleInProfile: 'none of the {total} titles {scope} is in profile «{profile}»',
            decisionsElsewhere: 'decisions exist in {profiles} — choose a profile in the list',
            scopePlaylist: 'in the playlist',
            scopeGroup: 'in the open group',
            confirmApply: 'Apply remembered decisions to {count} channels {scope}?',
            confirmApplyGroupChecks: 'Of these, {count} only move to another group.',
            readingNamesakes: 'titles shared by several channels, ch unknown: {count} — reading their addresses to tell them apart',
            loadingSource: 'loading the source… Tampermonkey may ask to allow the domain',
            sourceLoaded: 'source: {channels} channels, {titles} titles, {added} new',
            sourceFailed: 'the source did not load ({error}): ch comes only from forms already read. The playlist can be loaded as an .m3u file with "Load file"',
            syncDone: 'sync: recorded {recorded}, already matching {same}, filed under ch {filed}, disagreeing {clashes}',
            syncClashHint: 'Shift+click records the playlist as it is',
            syncClashField: '{field} remembered {remembered}, playlist has {actual}',
            confirmLockGroup: 'Group «{group}»: lock every channel (18+)?',
            confirmUnlockGroup: 'Group «{group}»: unlock every channel?',
            openingGroup: 'opening «{group}»…',
            groupNotOpened: 'group «{group}» did not open — open it by hand and repeat',
            noUnboundInGroup: 'group «{group}» has no unbound channels without a remembered binding',
            confirmNoChannel: 'Group «{group}»: set "no channel" for {count} channels?',
            libraryComplete: 'every needed probe is already made — library {size}',
            libraryProbes: 'new probes: {count}',
            libraryDone: 'library: {size} (+{added})',
            confirmDelete: 'Delete channel «{name}»?',
            deleted: '✕ channel deleted: {name}',
            deleteFailed: '⚠ deleting: {error}',
            refreshing: 'refreshing…',
            refreshed: 'list refreshed',
            refreshFailed: '⚠ refresh: {error}',
            firstSaveVerified: '✓ the first save was read back — saving works',
            firstSaveNotApplied: '⚠ the server accepted the save but did not change {fields}',
            firstSaveUnverified: 'could not read the first save back: {error}',
            exported: 'exported: library, decisions by title and by ch, probes',
            exportedCodes: 'ch map exported: {count} channels',
            exportedLibrary: 'library exported: {size}, probes {probes}',
            imported: 'import: library {library}, decisions {byTitle} by title and {byCode} by ch, probes {probes}',
            importedPlaylist: 'playlist from file: {channels} channels, {titles} titles, {added} new',
            importFailed: '⚠ import: {error}',
            profileChosen: 'profile {profile}: {decisions} decisions, {known} of {total} channels of this playlist have one',
            storageFull: '⚠ the browser storage is full — the latest decisions are not saved',
            ready: 'ready. Profile {profile} ({reason}), {decisions} decisions',
            reasonPlaylist: 'chosen for this playlist',
            reasonLast: 'last used',
            reasonLargest: 'largest saved',
            reasonUpdateUrl: 'from the playlist update_url',
            reasonDefault: 'default',
            reasonManual: 'chosen by hand',
            errorBlocked: 'the browser blocked the request',
            errorRedirected: 'the server redirected — it does not accept this address',
            errorSessionExpired: 'the session expired — log in again',
            errorFormNotFound: 'channel form not found',
            errorSearchRedirected: 'search redirected — check that you are logged in',
            errorSourceNoAnswer: 'the source did not answer',
            errorSourceTimeout: 'the source did not answer within 60 s',
            errorNoUpdateUrl: 'the playlist has no update_url',
            errorNoCodesInSource: 'the source has no channels with a ch code',
            diagTitle: '--- diagnostics ---',
            diagCounts: 'channels in the playlist {all}, in the open group {open}, groups {groups}, open «{group}»',
            diagProfile: 'profile {profile} ({reason}), decisions {byTitle} by title and {byCode} by ch',
            diagCodes: 'ch known for {withCode} of {all}; the source knows {titles} titles, {shared} shared; update_url set: {updateUrl}',
            diagFirstChannel: 'first channel: {channel}',
            diagEditUrl: 'edit address: {url}',
            diagForm: 'form fields (tokens masked): {fields}',
            diagFormFailed: 'form: {error}',
            diagGroupHandlers: 'the page\'s own code for deleting and hiding groups — attach it to an issue to have these actions added:',
            diagGroupHandlersNone: 'nothing found in the page scripts',
        },
        ru: {
            panelTitle: 'Органайзер плейлиста',
            collapse: 'свернуть',
            profile: 'профиль',
            profileHint: 'под каким ключом запоминаются решения',
            profileOption: '{name} — {byTitle} по названию · {byCode} по ch',
            apply: 'Применить запомненное',
            applyHint: 'весь плейлист; Shift — только открытая группа, без вопроса',
            sync: 'Синхронизировать',
            syncHint: 'загрузить источник, записать текущие привязки и замки в решения; Shift — плейлист прав при расхождении',
            buildLibrary: 'Собрать библиотеку',
            buildLibraryHint: 'по названиям плейлиста; Shift — полный перебор',
            exportAll: 'Выгрузить всё',
            exportCodes: 'ch-карта',
            exportCodesHint: 'ch → epg_id для репозитория',
            exportLibrary: 'Только библиотеку',
            import: 'Загрузить файл',
            importHint: '.json с решениями или .m3u плейлиста',
            refresh: 'Обновить список',
            diagnose: 'Диагностика',
            stop: 'Стоп',
            takeover: 'удалять канал без перезагрузки',
            pick: 'иконка',
            pickHint: 'выбрать иконку и EPG',
            lockSet: 'поставить 18+',
            lockRemove: 'снять 18+',
            moveHint: 'перенести в другую группу',
            moveTo: 'перенести в…',
            groupMenuHint: 'действия с группой',
            groupLock: 'Закрыть все (18+)',
            groupLockHint: 'закрыть все каналы группы (18+)',
            groupUnlock: 'Открыть все',
            groupUnlockHint: 'открыть все каналы группы',
            groupNoChannel: '«Нет канала» непривязанным',
            groupNoChannelHint: 'всем без привязки — «нет канала» (id 1): без неё у канала нет шкалы и архив не мотается',
            groupDissolve: 'Размыть в другую группу…',
            groupDissolveHint: 'перенести все каналы группы в другую — после подтверждения с их числом',
            groupFavourite: 'Сделать избранной',
            groupFavouriteHint: 'одна группа на плейлист: у каждого канала звезда, жёлтая — если он в этой группе',
            groupUnfavourite: 'Больше не избранная',
            groupUnfavouriteHint: 'звёзды пропадут, каналы не меняются',
            adultGroupsLocked: 'группы для взрослых: закрыто каналов (18+): {count}',
            groupUpdateCopies: 'Обновить копии',
            groupUpdateCopiesHint: 'дать каждой копии в группе текущие адрес, привязку и 18+ её оригинала: обновление плейлиста меняет адрес оригинала, но не копии',
            labelCopies: 'копии',
            copiesChecked: 'копии в «{group}»: обновлено по оригиналу {updated} из {count}, оставлено как есть {left}',
            copiesLeft: 'оставлены как есть в «{group}»: по их названию нет ровно одного оригинала и одной копии — {titles}',
            confirmUpdateCopies: 'Группа «{group}»: дать {count} копиям текущие адрес, привязку и 18+ их оригиналов?',
            confirmLeaveFavourite: 'В «{group}» копий каналов из других групп: {count}. Когда группа перестанет быть избранной, это обычные каналы: «Применить запомненное» может перенести каждую к её оригиналу, а «Обновить копии» их больше не обновит. Продолжить?',
            addressUpdated: 'новый адрес',
            favouriteSet: '★ избранная группа: «{group}»',
            favouriteCleared: 'избранной группы больше нет',
            labelFavourite: 'избранное',
            starAdd: 'добавить копию канала в избранную группу «{group}»',
            starRemove: 'есть в «{group}»: убрать оттуда копию, сам канал остаётся на месте',
            starAlone: '«{title}» есть только в «{group}»: канал, который там живёт, или копия, чей оригинал переименован или удалён, — звезда его не трогает',
            starAmbiguous: 'каналов с названием «{title}» несколько: звезда не может понять, чья копия чья',
            copyUnclear: 'в «{group}» ожидалась одна новая строка с этим названием, найдено {count}',
            copyUnfinished: '«{title}»: копия в «{group}» могла остаться с привязкой сайта и без 18+ — проверьте её там или нажмите «Обновить копии»',
            copyAlreadyThere: '«{title}» уже есть в «{group}», вторая копия не создаётся: список группы показан таким, какой он на сайте',
            otherStream: '«{title}» в «{group}» играет другой поток, чем канал с тем же названием вне группы: не считается копией и оставлен как есть. Если это всё же копия — удалите её корзиной и поставьте звезду заново',
            copyNotMoved: '«{title}» не перенесён: в избранной группе остаётся ровно одна его копия',
            dissolveTitle: 'Размыть «{group}»',
            dissolveTarget: 'перенести её каналы в',
            dissolveChoose: 'В «{from}» каналов: {count}. Выберите группу, которая их примет.',
            dissolveCount: 'Из «{from}» в «{to}» перейдёт каналов: {count}.',
            dissolveConfirm: 'Перенести каналов: {count}',
            dissolveDone: '«{from}» → «{to}»: перенесено {moved} из {total}',
            groupEmpty: 'в группе «{group}» нет каналов',
            labelDissolve: 'размытие',
            cancel: 'Отмена',
            jqueryUiMissing: 'на странице нет jQuery UI: меню группы открывается простым списком, без управления с клавиатуры',
            uikitMissing: 'на странице нет окна UIkit (modal): окно размытия открывается окном органайзера',
            currentBinding: 'текущая привязка',
            currentUnbound: 'не привязан',
            headerProfile: 'профиль {profile} · решений {byTitle} по названию, {byCode} по ch · библиотека {library} · запросов {probes}',
            headerGroup: 'в группе {total} из {all}, ch известен у {withCode} · без привязки {unbound} · «нет канала» {noChannel} · 18+ {adult} · ждут {pending}',
            searchPlaceholder: 'поиск по библиотеке…',
            noChannelButton: 'нет канала (1)',
            noChannelHint: 'поставить «нет канала»',
            noChannelName: 'нет канала',
            close: 'закрыть',
            pickerHint: 'библиотека {library} · запросов {probes}',
            pickerHintAdded: 'добавлено по «{probes}»',
            requesting: 'запрашиваю: {probes}…',
            typeToSearch: 'Введите слово для поиска.',
            nothingFoundEvenFor: 'Ничего не найдено даже по «{word}».',
            relaxedQuery: 'По «{query}» ничего нет — показано по «{used}»',
            truncatedResults: 'Найдено {total}, показаны первые {limit} — уточните запрос',
            stopping: 'останавливаю…',
            stopped: 'остановлено',
            batchChanged: '{label}: изменено {changed} из {total}',
            batchUnchanged: 'уже было так {count}',
            batchFailed: 'ошибок {count}',
            labelBinding: 'привязка',
            labelMove: 'перенос',
            labelApply: 'применяю',
            labelSearch: 'поиск',
            changeUnlocked: 'без 18+',
            noChannelsVisible: 'каналов не видно — откройте вкладку Channels',
            allAsRemembered: 'всё уже как запомнено: решение есть у {known} из {total} каналов {scope}',
            noTitleInProfile: 'ни одно из {total} названий {scope} не найдено в профиле «{profile}»',
            decisionsElsewhere: 'решения есть в {profiles} — выберите профиль в списке',
            scopePlaylist: 'в плейлисте',
            scopeGroup: 'в открытой группе',
            confirmApply: 'Применить запомненное к {count} каналам {scope}?',
            confirmApplyGroupChecks: 'Из них {count} — только перенос в другую группу.',
            readingNamesakes: 'одинаковых названий без ch: {count} — читаю их адреса, чтобы различить',
            loadingSource: 'загружаю источник… Tampermonkey может спросить разрешение на домен',
            sourceLoaded: 'источник: {channels} каналов, названий {titles}, новых {added}',
            sourceFailed: 'источник не загрузился ({error}): ch возьмётся только из уже прочитанных форм. Плейлист можно подложить файлом .m3u через «Загрузить файл»',
            syncDone: 'синхронизация: записано {recorded}, уже совпадало {same}, подшито под ch {filed}, расходится с запомненным {clashes}',
            syncClashHint: 'Shift+клик запишет плейлист как есть',
            syncClashField: '{field} запомнено {remembered}, в плейлисте {actual}',
            confirmLockGroup: 'Группа «{group}»: закрыть все каналы (18+)?',
            confirmUnlockGroup: 'Группа «{group}»: открыть все каналы?',
            openingGroup: 'открываю «{group}»…',
            groupNotOpened: 'группа «{group}» не открылась — откройте её вручную и повторите',
            noUnboundInGroup: 'в группе «{group}» нет непривязанных каналов без запомненной привязки',
            confirmNoChannel: 'Группа «{group}»: поставить «нет канала» для {count} каналов?',
            libraryComplete: 'все нужные запросы уже сделаны — библиотека {size}',
            libraryProbes: 'новых запросов: {count}',
            libraryDone: 'библиотека: {size} (+{added})',
            confirmDelete: 'Удалить канал «{name}»?',
            deleted: '✕ удалён канал: {name}',
            deleteFailed: '⚠ удаление: {error}',
            refreshing: 'обновляю…',
            refreshed: 'список обновлён',
            refreshFailed: '⚠ обновление: {error}',
            firstSaveVerified: '✓ первая запись перечитана — сохранение работает',
            firstSaveNotApplied: '⚠ сервер принял запись, но не изменил {fields}',
            firstSaveUnverified: 'перечитать первую запись не удалось: {error}',
            exported: 'выгружено: библиотека, решения по названию и по ch, база запросов',
            exportedCodes: 'выгружена ch-карта: {count} каналов',
            exportedLibrary: 'выгружена библиотека: {size}, запросов {probes}',
            imported: 'импорт: библиотека {library}, решений {byTitle} по названию и {byCode} по ch, запросов {probes}',
            importedPlaylist: 'плейлист из файла: {channels} каналов, названий {titles}, новых {added}',
            importFailed: '⚠ импорт: {error}',
            profileChosen: 'профиль {profile}: решений {decisions}, из них есть в этом плейлисте у {known} из {total}',
            storageFull: '⚠ хранилище браузера заполнено — последние решения не сохранены',
            ready: 'готов. Профиль {profile} ({reason}), решений {decisions}',
            reasonPlaylist: 'выбран для этого плейлиста',
            reasonLast: 'последний использованный',
            reasonLargest: 'самый большой из сохранённых',
            reasonUpdateUrl: 'по update_url плейлиста',
            reasonDefault: 'по умолчанию',
            reasonManual: 'выбран вручную',
            errorBlocked: 'запрос заблокирован браузером',
            errorRedirected: 'сервер перенаправил запрос — этот адрес он не принимает',
            errorSessionExpired: 'сессия истекла — войдите заново',
            errorFormNotFound: 'форма канала не найдена',
            errorSearchRedirected: 'поиск перенаправлен — проверьте, что вы вошли',
            errorSourceNoAnswer: 'источник не ответил',
            errorSourceTimeout: 'источник не ответил за 60 с',
            errorNoUpdateUrl: 'у плейлиста не задан update_url',
            errorNoCodesInSource: 'в источнике нет каналов с ch-кодом',
            diagTitle: '--- диагностика ---',
            diagCounts: 'каналов в плейлисте {all}, в открытой группе {open}, групп {groups}, открыта «{group}»',
            diagProfile: 'профиль {profile} ({reason}), решений {byTitle} по названию и {byCode} по ch',
            diagCodes: 'ch известен у {withCode} из {all}; источник знает {titles} названий, общих у нескольких каналов {shared}; update_url задан: {updateUrl}',
            diagFirstChannel: 'первый канал: {channel}',
            diagEditUrl: 'адрес правки: {url}',
            diagForm: 'поля формы (токены скрыты): {fields}',
            diagFormFailed: 'форма: {error}',
            diagGroupHandlers: 'собственный код страницы для удаления и скрытия групп — приложите его к issue, чтобы эти действия появились:',
            diagGroupHandlersNone: 'в скриптах страницы ничего не нашлось',
        },
    };

    const userLang = detectLanguage();

    function t(key, params = {}) {
        const template = translations[userLang][key] || translations.en[key] || key;
        return template.replace(/\{(\w+)}/g, (placeholder, name) => (name in params ? String(params[name]) : placeholder));
    }

    function detectLanguage() {
        const cookieLanguage = (document.cookie.match(/(?:^|;\s*)lang=[^;]*?([a-z]{2})(?=;|$)/i) || [])[1];
        return /^ru/i.test(cookieLanguage || $('html').attr('lang') || navigator.language) ? 'ru' : 'en';
    }

    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    const size = object => Object.keys(object || {}).length;
    const byChannelNumber = (a, b) => parseInt(a.slice(2), 10) - parseInt(b.slice(2), 10);
    const maskTokens = text => String(text).replace(/token=[^&"\s]+/g, 'token=…');
    const parseJson = text => JSON.parse(text, (key, value) => (key === '__proto__' ? undefined : value));
    const dictionary = (entries = {}) => Object.assign(Object.create(null), entries);
    const groupKey = title => String(title || '').replace(/\s+/g, ' ').trim().toLowerCase();

    const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    const escapeHtml = text => String(text == null ? '' : text).replace(/[&<>"']/g, char => HTML_ESCAPES[char]);

    function describeError(error) {
        const message = String((error && error.message) || error);
        return /failed to fetch|networkerror/i.test(message) ? t('errorBlocked') : message;
    }

    function throttle(fn, intervalMs) {
        let queued = false;
        let lastRun = 0;
        return () => {
            if (queued) return;
            queued = true;
            setTimeout(() => {
                queued = false;
                lastRun = Date.now();
                fn();
            }, Math.max(0, intervalMs - (Date.now() - lastRun)));
        };
    }

    async function inSlices(items, work) {
        for (let start = 0; start < items.length; start += ROWS_PER_SLICE) {
            if (start) await sleep(0);
            items.slice(start, start + ROWS_PER_SLICE).forEach(work);
        }
    }

    async function waitUntil(condition, isStopped, attempts = 15) {
        for (let attempt = 0; attempt < attempts && !isStopped(); attempt++) {
            if (condition()) return true;
            await sleep(100);
        }
        return condition();
    }

    /** jQuery's trigger('click') on a link runs jQuery handlers only, never the browser's own action */
    function clickNatively($element) {
        if ($element.length) $element[0].click();
    }

    /** DOMParser, not $.parseHTML: its document is inert, so parsing a page of results loads none of its images */
    function parseInertHtml(html) {
        return new DOMParser().parseFromString(html, 'text/html');
    }

    function saveJsonFile(filename, data) {
        const href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
        const $link = $('<a>', { href, download: filename }).appendTo('body');
        clickNatively($link);
        setTimeout(() => {
            URL.revokeObjectURL(href);
            $link.remove();
        }, 800);
    }

    const CYRILLIC_TO_LATIN = {
        а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i',
        й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't',
        у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'i',
        ь: '', э: 'e', ю: 'yu', я: 'ya', і: 'i', ї: 'i', є: 'e', ґ: 'g',
    };
    const LATIN_TO_CYRILLIC = {
        a: 'а', b: 'б', v: 'в', w: 'в', g: 'г', d: 'д', e: 'е', z: 'з', i: 'и', y: 'и',
        j: 'й', k: 'к', c: 'к', q: 'к', l: 'л', m: 'м', n: 'н', o: 'о', p: 'п', r: 'р',
        s: 'с', t: 'т', u: 'у', f: 'ф', h: 'х', x: 'к',
    };
    const LATIN_LOOKALIKES_OF_CYRILLIC = { a: 'а', b: 'в', c: 'с', e: 'е', h: 'н', k: 'к', m: 'м', o: 'о', p: 'р', t: 'т', x: 'х', y: 'у' };
    const CYRILLIC_LOOKALIKES_OF_LATIN = Object.fromEntries(
        Object.entries(LATIN_LOOKALIKES_OF_CYRILLIC).map(([latin, cyrillic]) => [cyrillic, latin]));

    const QUALITY_WORD = /^(?:[hн]d|sd|f[hн]d|u[hн]d|[hн]dr|4[kк])$/;
    const TV_OR_CHANNEL_WORD = /^(?:tv|[tт]в|т[vb]|канал|channel)$/;

    const isCyrillic = char => /[Ѐ-ӿ]/.test(char);
    const isLatin = char => char >= 'a' && char <= 'z';
    const consonants = word => word.replace(/[aeiou]/g, '');

    class ChannelTitle {
        /** OttPlayer's own title normalisation; decisions are filed under it, so changing it strands them */
        static key(title) {
            return String(title || '')
                .replace(/<(?:.|\n)*?>/gm, '')
                .replace(/\([^()]*\)/gm, '')
                .replace(/\[[^\[\]]*\]/gm, '')
                .replace(/\s+/g, ' ')
                .trim()
                .toLowerCase();
        }

        static words(text) {
            return ChannelTitle.key(text).replace(/[^\p{L}\p{N} ]/gu, ' ').split(' ').filter(Boolean);
        }

        static startPhrase(title) {
            const words = ChannelTitle.words(ChannelTitle.withoutTimeshift(title));
            const withoutNoise = words.filter(word => !ChannelTitle.isNoiseWord(word)).flatMap(ChannelTitle.splitTrailingNumber);
            const withoutQuality = words.filter(word => !QUALITY_WORD.test(word));
            return ([withoutNoise, withoutQuality].find(ChannelTitle.hasLetter) || words).join(' ');
        }

        static withoutTimeshift(title) {
            return String(title || '').replace(/\s*\+\d+/g, ' ');
        }

        static isNoiseWord(word) {
            return QUALITY_WORD.test(word) || TV_OR_CHANNEL_WORD.test(word);
        }

        static splitTrailingNumber(word) {
            return word.replace(/(\p{L})(\d+)$/u, '$1 $2').split(' ');
        }

        static hasLetter(words) {
            return words.some(word => /\p{L}/u.test(word));
        }

        static fold(text) {
            return [...ChannelTitle.unifyScripts(String(text || '').toLowerCase())]
                .map(char => CYRILLIC_TO_LATIN[char] ?? char)
                .join('')
                .replace(/[cq]/g, 'k')
                .replace(/w/g, 'v')
                .replace(/[yj]/g, 'i')
                .replace(/x/g, 'ks')
                .replace(/(.)\1+/g, '$1');
        }

        static unifyScripts(text) {
            return text.replace(/\p{L}+/gu, word => ChannelTitle.unifyWord(word));
        }

        static unifyWord(word) {
            const letters = [...word];
            const cyrillic = letters.filter(isCyrillic).length;
            const latin = letters.filter(isLatin).length;
            if (!cyrillic || !latin) return word;
            const lookalikes = cyrillic >= latin ? LATIN_LOOKALIKES_OF_CYRILLIC : CYRILLIC_LOOKALIKES_OF_LATIN;
            return letters.map(char => lookalikes[char] || char).join('');
        }

        static inOtherAlphabet(word) {
            return [...word].map(char => CYRILLIC_TO_LATIN[char] ?? LATIN_TO_CYRILLIC[char] ?? char).join('');
        }

        static matches(foldedName, foldedWords) {
            if (!foldedName) return false;
            const nameWords = foldedName.split(' ').filter(Boolean);
            return foldedWords.every(word => !word || foldedName.includes(word)
                || nameWords.some(nameWord => ChannelTitle.wordsCorrespond(word, nameWord)));
        }

        static wordsCorrespond(word, nameWord) {
            return nameWord.startsWith(word)
                || ChannelTitle.isLongerFormOf(word, nameWord)
                || ChannelTitle.hasSameConsonants(word, nameWord);
        }

        static isLongerFormOf(word, nameWord) {
            return word.length >= 3 && nameWord.length >= 3 && word.startsWith(nameWord);
        }

        static hasSameConsonants(word, nameWord) {
            return word.length >= 5 && nameWord.length >= 5 && consonants(word) === consonants(nameWord);
        }
    }

    const Star = Object.freeze({ OFF: 'off', ON: 'on', ALONE: 'alone', AMBIGUOUS: 'ambiguous' });

    class FavouriteCopies {
        /** a channel has exactly one group, so its copy in the favourite group is a channel of its own: only the exact title ties the two */
        static indexOf(rows, favouriteId) {
            const index = { insideIds: new Set(), insideByTitle: new Map(), outsideByTitle: new Map() };
            rows.forEach(({ uuid, title, groupId }) => {
                const inside = groupId === favouriteId;
                const byTitle = inside ? index.insideByTitle : index.outsideByTitle;
                if (inside) index.insideIds.add(uuid);
                byTitle.set(title, (byTitle.get(title) || []).concat(uuid));
            });
            return index;
        }

        static starOf(channel, index) {
            const copies = FavouriteCopies.idsOf(index.insideByTitle, channel).length;
            const originals = FavouriteCopies.idsOf(index.outsideByTitle, channel).length;
            if (copies > 1 || originals > 1) return Star.AMBIGUOUS;
            if (index.insideIds.has(channel.uuid)) return originals ? Star.ON : Star.ALONE;
            return copies ? Star.ON : Star.OFF;
        }

        static copyIdOf(channel, index) {
            return FavouriteCopies.onlyIdOf(index.insideByTitle, channel);
        }

        static originalIdOf(channel, index) {
            return FavouriteCopies.onlyIdOf(index.outsideByTitle, channel);
        }

        static onlyIdOf(byTitle, channel) {
            const ids = FavouriteCopies.idsOf(byTitle, channel);
            return ids.length === 1 ? ids[0] : null;
        }

        static idsOf(byTitle, channel) {
            return byTitle.get(channel.title) || [];
        }

        static hintOf(star) {
            return { [Star.OFF]: 'starAdd', [Star.ON]: 'starRemove', [Star.ALONE]: 'starAlone', [Star.AMBIGUOUS]: 'starAmbiguous' }[star];
        }
    }

    class SourcePlaylist {
        static async load(url) {
            const channels = SourcePlaylist.parse(await SourcePlaylist.fetchText(url));
            if (!channels.length) throw new Error(t('errorNoCodesInSource'));
            return channels;
        }

        /** a source is usually plain http on another host, which only GM_xmlhttpRequest may read from this https page */
        static fetchText(url) {
            return new Promise((resolve, reject) => GM_xmlhttpRequest({
                method: 'GET',
                url,
                timeout: 60000,
                onload: response => (response.status >= 200 && response.status < 300
                    ? resolve(response.responseText)
                    : reject(new Error(`HTTP ${response.status}`))),
                onerror: () => reject(new Error(t('errorSourceNoAnswer'))),
                ontimeout: () => reject(new Error(t('errorSourceTimeout'))),
            }));
        }

        static parse(text) {
            const channels = [];
            let pending = null;
            for (const line of String(text).split(/\r?\n/).map(raw => raw.trim())) {
                if (line.startsWith('#EXTINF')) {
                    pending = SourcePlaylist.parseExtinf(line);
                } else if (line && !line.startsWith('#') && pending) {
                    const ch = SourcePlaylist.channelCode(line) || SourcePlaylist.channelCode(pending.tvgId);
                    if (ch) channels.push({ title: pending.title, ch });
                    pending = null;
                }
            }
            return channels;
        }

        static parseExtinf(line) {
            const match = line.match(/^#EXTINF:((?:[^",]|"[^"]*")*),(.*)$/);
            return match ? { title: match[2].trim(), tvgId: (match[1].match(/\btvg-id="([^"]*)"/) || [])[1] } : null;
        }

        static channelCode(text) {
            const match = String(text || '').match(/(?:^|\/)ch0*(\d+)(?:\/|$)/i);
            return match ? `ch${match[1]}` : null;
        }
    }

    class LibraryIcon {
        static url(id) {
            return `${ORIGIN}/public/images/lib_channels/${id}.png`;
        }

        static idOf(src) {
            return (String(src || '').match(/lib_channels\/(\d+)\.png/) || [])[1] || null;
        }

        static img(id, cls = '') {
            return $('<img>', { 'data-om-fb': '', class: cls, loading: 'lazy', src: LibraryIcon.url(id) });
        }

        /** library ids without artwork answer 404; image errors do not bubble, so only a capture listener sees them */
        static replaceMissingWithPlaceholder() {
            document.addEventListener('error', event => {
                const $image = $(event.target);
                if (!$image.is('img[data-om-fb=""]')) return;
                $image.attr({ 'data-om-fb': 'used', src: LibraryIcon.url(NO_CHANNEL) }).addClass('om-noart');
            }, true);
        }
    }

    class LibraryResponse {
        static parse(text) {
            return LibraryResponse.fromJson(text) || LibraryResponse.fromHtml(text) || LibraryResponse.bareIds(text);
        }

        static fromJson(text) {
            let data;
            try {
                data = parseJson(text);
            } catch (notJson) {
                return null;
            }
            const found = {};
            (function collect(node) {
                if (!node || typeof node !== 'object') return;
                const id = node.id || node.epg_id || node.libchannel_id || node.lib_id;
                const name = node.name || node.title || node.ch_title;
                if (id && name) found[String(id)] = String(name).trim();
                Object.values(node).forEach(collect);
            })(data);
            return size(found) ? found : null;
        }

        static fromHtml(text) {
            const found = {};
            $(parseInertHtml(text)).find('img').each((index, image) => {
                const id = LibraryIcon.idOf($(image).attr('src') || $(image).attr('data-src'));
                const name = id && LibraryResponse.nameNextTo($(image));
                if (name) found[id] = name;
            });
            return size(found) ? found : null;
        }

        static bareIds(text) {
            const found = {};
            for (const [, id] of String(text).matchAll(/lib_channels\/(\d+)\.png/g)) {
                found[id] = found[id] || '';
            }
            return found;
        }

        static nameNextTo($image) {
            const $host = $image.closest('li,tr,label,a,div');
            const text = $host.length ? $host.clone().find('img').remove().end().text().replace(/\s+/g, ' ').trim() : '';
            return text || $image.attr('alt') || $image.attr('title') || '';
        }
    }

    class Store {
        constructor(storage, key, onSaveFailed = () => {}) {
            this.storage = storage;
            this.key = key;
            this.onSaveFailed = onSaveFailed;
            this.data = this.load();
            this.saveSoon = throttle(() => this.save(), 5000);
        }

        static get BUCKETS() {
            return ['profiles', 'chmaps', 'titleCh', 'rowCh', 'noChannel'];
        }

        static get MAPS() {
            return ['library', 'queries', 'favouriteGroups'];
        }

        /** every map keyed by titles, codes or ids is prototype-free, so no key can reach Object.prototype */
        load() {
            const data = Object.assign({ version: 1, settings: {} }, this.readJson());
            Store.MAPS.forEach(name => {
                data[name] = dictionary(data[name]);
            });
            Store.BUCKETS.forEach(name => {
                data[name] = Store.bucketsWithoutEmpty(data[name]);
            });
            return data;
        }

        static bucketsWithoutEmpty(buckets) {
            return dictionary(Object.fromEntries(Object.entries(buckets || {})
                .filter(([, bucket]) => size(bucket))
                .map(([name, bucket]) => [name, dictionary(bucket)])));
        }

        mergeFromStorage() {
            const fresh = this.load();
            Store.MAPS.concat('settings').forEach(name => Object.assign(this.data[name], fresh[name]));
            Store.BUCKETS.forEach(name => Store.mergeBuckets(this.data[name], fresh[name]));
        }

        readJson() {
            try {
                return parseJson(this.storage.getItem(this.key) || 'null') || {};
            } catch (corrupted) {
                return {};
            }
        }

        save() {
            try {
                this.storage.setItem(this.key, JSON.stringify(this.data));
                return true;
            } catch (quotaExceeded) {
                this.onSaveFailed(quotaExceeded);
                return false;
            }
        }

        getItem(name) {
            return this.storage.getItem(`${this.key}:${name}`);
        }

        setItem(name, value) {
            try {
                this.storage.setItem(`${this.key}:${name}`, value);
            } catch (quotaExceeded) {
                this.onSaveFailed(quotaExceeded);
            }
        }

        fullExport(currentProfile) {
            const { library, queries, profiles, chmaps, titleCh, rowCh, noChannel, favouriteGroups } = this.data;
            return Object.assign(Store.stamp(), { profile: currentProfile, library, queries, profiles, chmaps, titleCh, rowCh, noChannel, favouriteGroups });
        }

        static mergeBuckets(target, source) {
            return Object.entries(source || {}).reduce((total, [name, records]) => total + Store.mergeRecords(target, name, records), 0);
        }

        static mergeRecords(target, name, records) {
            target[name] = target[name] || dictionary();
            for (const [id, record] of Object.entries(records || {})) {
                target[name][id] = record && typeof record === 'object' ? Object.assign({}, target[name][id], record) : record;
            }
            return size(records);
        }

        static stamp() {
            return { version: 1, exported: new Date().toISOString() };
        }
    }

    class Decisions {
        constructor(store, playlistId, updateUrl) {
            this.store = store;
            this.playlistId = playlistId;
            this.profile = this.pickProfile(updateUrl);
        }

        get data() {
            return this.store.data;
        }

        pickProfile(updateUrl) {
            const choices = [
                [this.store.getItem(`profile:${this.playlistId}`) || this.legacyPinnedProfile(), 'reasonPlaylist'],
                [this.store.getItem('profile:last'), 'reasonLast'],
                [this.largestProfile(), 'reasonLargest'],
                [Decisions.providerOf(updateUrl), 'reasonUpdateUrl'],
                ['default', 'reasonDefault'],
            ];
            const [name, reason] = choices.find(([candidate]) => candidate);
            return { name, reason };
        }

        legacyPinnedProfile() {
            return this.store.getItem(`pin:${this.playlistId}`) === '1' ? this.store.getItem(`src:${this.playlistId}`) : null;
        }

        largestProfile() {
            const profiles = this.data.profiles;
            return Object.keys(profiles).sort((a, b) => size(profiles[b]) - size(profiles[a]))[0] || null;
        }

        static providerOf(url) {
            const labels = String(url || '').toLowerCase().replace(/^https?:\/\//, '').split(/[\/?#]/)[0].split('.');
            while (labels.length > 2 && /^\d+$/.test(labels[0])) {
                labels.shift();
            }
            return labels.join('.');
        }

        switchTo(name, reason) {
            this.profile = { name, reason };
            this.store.setItem(`profile:${this.playlistId}`, name);
            this.store.setItem('profile:last', name);
        }

        pinProfileToPlaylist() {
            if (this.store.getItem(`profile:${this.playlistId}`) !== this.profile.name) this.switchTo(this.profile.name, this.profile.reason);
        }

        byTitle() {
            return Decisions.ensureBucket(this.data.profiles, this.profile.name);
        }

        byCode() {
            return Decisions.ensureBucket(this.data.chmaps, this.profile.name);
        }

        titleCodes() {
            return Decisions.ensureBucket(this.data.titleCh, this.profile.name);
        }

        rowCodes() {
            return Decisions.ensureBucket(this.data.rowCh, this.playlistId);
        }

        noChannelRows() {
            return Decisions.ensureBucket(this.data.noChannel, this.playlistId);
        }

        static ensureBucket(buckets, name) {
            return buckets[name] || (buckets[name] = dictionary());
        }

        codeOf(channel) {
            return this.rowCodes()[channel.uuid] || this.uniqueCodeOfTitle(channel.title);
        }

        uniqueCodeOfTitle(title) {
            const ch = this.titleCodes()[ChannelTitle.key(title)];
            return ch && ch !== SHARED_TITLE ? ch : null;
        }

        isSharedTitle(title) {
            return this.titleCodes()[ChannelTitle.key(title)] === SHARED_TITLE;
        }

        sharedTitleCount() {
            return Object.values(this.titleCodes()).filter(ch => ch === SHARED_TITLE).length;
        }

        decisionFor(channel) {
            const ch = this.codeOf(channel);
            const byTitle = this.isSharedTitle(channel.title) ? null : this.byTitle()[ChannelTitle.key(channel.title)];
            const byCode = ch && this.byCode()[ch];
            return byTitle || byCode ? Object.assign({}, byTitle, byCode) : null;
        }

        pendingChanges(channel) {
            const decision = this.decisionFor(channel);
            return decision ? Decisions.visibleChangesTo(decision, channel) : {};
        }

        static visibleChangesTo(decision, channel) {
            const wanted = {};
            if (decision.epg_id && decision.epg_id !== channel.libId) wanted.libchannel_id = decision.epg_id;
            if (decision.adult !== undefined && (decision.adult === '1') !== channel.adult) wanted.adult = decision.adult;
            return wanted;
        }

        /** the list a row sits in is its group; a row outside any known list is asked for its remembered group */
        static changesTo(decision, channel, groupsByTitle) {
            const wanted = Decisions.visibleChangesTo(decision, channel);
            const group = decision.group && groupsByTitle.get(groupKey(decision.group));
            if (group && group.id !== channel.groupId) wanted.group_id = group.id;
            return wanted;
        }

        static adultValue(adult) {
            return adult ? '1' : '0';
        }

        remember(channel, patch) {
            const ch = this.codeOf(channel);
            if (ch) this.byCode()[ch] = Object.assign({}, this.byCode()[ch], patch, { title: channel.title });
            if (!this.isSharedTitle(channel.title)) {
                const key = ChannelTitle.key(channel.title);
                this.byTitle()[key] = Object.assign({}, this.byTitle()[key], patch);
            }
            this.pinProfileToPlaylist();
        }

        fileUnderCode(channel, decision) {
            const ch = this.codeOf(channel);
            if (ch) this.byCode()[ch] = Object.assign({}, decision, this.byCode()[ch], { title: channel.title });
            this.pinProfileToPlaylist();
        }

        learnRowCode(channel, ch) {
            if (ch) this.rowCodes()[channel.uuid] = ch;
        }

        /** the page shows "no channel" exactly like no binding at all, so the rows known to carry it are remembered */
        learnRowBinding(channel, libId) {
            if (libId === NO_CHANNEL) {
                this.noChannelRows()[channel.uuid] = 1;
            } else {
                delete this.noChannelRows()[channel.uuid];
            }
        }

        isKnownNoChannel(uuid) {
            return Boolean(this.noChannelRows()[uuid]);
        }

        favouriteGroupId() {
            return String(this.data.favouriteGroups[this.playlistId] || '');
        }

        isFavouriteGroup(groupId) {
            return Boolean(groupId) && groupId === this.favouriteGroupId();
        }

        setFavouriteGroup(groupId) {
            this.data.favouriteGroups[this.playlistId] = groupId;
        }

        /** an empty id rather than a deleted key: merging another tab's save would bring a deleted key back */
        clearFavouriteGroup() {
            this.data.favouriteGroups[this.playlistId] = '';
        }

        learnSource(channels) {
            const fresh = dictionary();
            for (const { title, ch } of channels) {
                const key = ChannelTitle.key(title);
                fresh[key] = key in fresh && fresh[key] !== ch ? SHARED_TITLE : ch;
            }
            const known = this.titleCodes();
            const added = Object.keys(fresh).filter(key => !(key in known)).length;
            Object.assign(known, fresh);
            return { channels: channels.length, titles: size(fresh), added };
        }

        fileTitleDecisionsUnderCodes(displayTitles) {
            let filed = 0;
            for (const [key, decision] of Object.entries(this.byTitle())) {
                const ch = this.titleCodes()[key];
                const current = (ch && this.byCode()[ch]) || {};
                const missing = Object.fromEntries(Object.entries(decision).filter(([field]) => current[field] === undefined));
                if (ch && size(missing)) {
                    this.byCode()[ch] = Object.assign({}, current, missing, { title: current.title || displayTitles[key] || key });
                    filed++;
                }
            }
            return filed;
        }

        profileSummaries() {
            const names = new Set([...Object.keys(this.data.profiles), ...Object.keys(this.data.chmaps), this.profile.name]);
            return [...names]
                .map(name => ({ name, byTitle: size(this.data.profiles[name]), byCode: size(this.data.chmaps[name]) }))
                .sort((a, b) => (b.byTitle + b.byCode) - (a.byTitle + a.byCode));
        }

        otherProfilesWithDecisions() {
            return this.profileSummaries().filter(profile => profile.name !== this.profile.name && profile.byTitle);
        }

        codeMapExport() {
            const codes = this.byCode();
            const channels = Object.fromEntries(Object.keys(codes).sort(byChannelNumber).map(ch => [ch, codes[ch]]));
            return Object.assign(Store.stamp(), { profile: this.profile.name, channels });
        }

        importDecisions(backup) {
            const byTitle = Store.mergeBuckets(this.data.profiles, backup.profiles);
            const byCode = Store.mergeBuckets(this.data.chmaps, backup.chmaps)
                + (backup.channels ? Store.mergeRecords(this.data.chmaps, backup.profile || this.profile.name, backup.channels) : 0);
            Store.mergeBuckets(this.data.titleCh, backup.titleCh);
            Store.mergeBuckets(this.data.rowCh, backup.rowCh);
            Store.mergeBuckets(this.data.noChannel, backup.noChannel);
            Object.assign(this.data.favouriteGroups, backup.favouriteGroups);
            return { byTitle, byCode };
        }
    }

    class LibraryIndex {
        constructor(store, site) {
            this.store = store;
            this.site = site;
            this.collator = new Intl.Collator('ru', { numeric: true });
            this.sorted = null;
        }

        get size() {
            return size(this.store.data.library);
        }

        get probeCount() {
            return size(this.store.data.queries);
        }

        nameOf(id) {
            return this.store.data.library[id] || '';
        }

        merge(found) {
            const library = this.store.data.library;
            let added = 0;
            for (const [id, name] of Object.entries(found)) {
                if (!(id in library) || (name && library[id] !== name)) {
                    library[id] = name;
                    added++;
                }
            }
            if (added) this.invalidate();
            return added;
        }

        invalidate() {
            this.sorted = null;
        }

        unprobed(probes) {
            return probes.filter(probe => !this.store.data.queries[probe]);
        }

        markProbed(probe) {
            this.store.data.queries[probe] = Date.now();
        }

        async probe(probe) {
            const added = this.merge(await this.site.searchLibrary(probe));
            this.markProbed(probe);
            return added;
        }

        async collect(probes) {
            for (const probe of probes) {
                await this.probeOrLeaveForNextTime(probe);
                await sleep(REQUEST_DELAY_MS);
            }
            this.store.save();
        }

        probeOrLeaveForNextTime(probe) {
            return this.probe(probe).catch(() => 0);
        }

        search(text) {
            const words = ChannelTitle.words(text);
            for (let count = words.length; count > 0; count--) {
                const used = words.slice(0, count);
                const folded = used.map(word => ChannelTitle.fold(word));
                const hits = this.entries().filter(entry => ChannelTitle.matches(entry.folded, folded));
                if (hits.length) return { words, used, hits };
            }
            return { words, used: [], hits: [] };
        }

        entries() {
            if (!this.sorted) {
                this.sorted = Object.entries(this.store.data.library)
                    .map(([id, name]) => ({ id, name: name || '', folded: ChannelTitle.fold(ChannelTitle.key(name)) }))
                    .sort((a, b) => this.collator.compare(a.name, b.name));
            }
            return this.sorted;
        }

        exportData() {
            return Object.assign(Store.stamp(), { library: this.store.data.library, queries: Object.keys(this.store.data.queries).sort() });
        }

        importLibrary(backup) {
            const probes = Array.isArray(backup.queries) ? backup.queries : Object.keys(backup.queries || {});
            this.merge(backup.library || {});
            probes.forEach(probe => {
                this.store.data.queries[probe] = this.store.data.queries[probe] || 1;
            });
            return { library: size(backup.library), probes: probes.length };
        }

        /** the server matches literal letters, so every word is probed by its first two letters in both alphabets */
        static probesFor(text) {
            const probes = new Set();
            ChannelTitle.words(text).filter(word => word.length >= 2).forEach(word => {
                probes.add(word.slice(0, 2));
                const other = ChannelTitle.inOtherAlphabet(word).slice(0, 2);
                if (other.length === 2) probes.add(other);
            });
            return [...probes];
        }

        static allLetterPairs() {
            const letters = [...'abcdefghijklmnopqrstuvwxyz0123456789абвгдежзийклмнопрстуфхцчшщэюя'];
            return letters.flatMap(first => letters.map(second => first + second));
        }
    }

    class OttPlayerSite {
        constructor(window) {
            this.window = window;
        }

        /** the site's own links are sometimes http://; every request goes to https://ottplayer.tv */
        static siteUrl(url) {
            try {
                const { pathname, search, hash } = new URL(url, location.href);
                return ORIGIN + pathname + search + hash;
            } catch (notAnAddress) {
                return null;
            }
        }

        static isLoginPage(html) {
            return /action=["'][^"']*\/account\/login/i.test(html);
        }

        /** a save or delete answers 302 to http://, which a fetch from this https page may not follow: the redirect itself is the answer */
        async requestWithoutFollowingRedirects(url, init = {}) {
            const target = OttPlayerSite.siteUrl(url);
            try {
                const response = await this.window.fetch(target, Object.assign({ credentials: 'same-origin', redirect: 'manual' }, init));
                const redirected = response.type === 'opaqueredirect' || (response.status >= 300 && response.status < 400);
                if (!redirected && !response.ok) throw new Error(`HTTP ${response.status}`);
                return { response, redirected };
            } catch (error) {
                throw Object.assign(error instanceof Error ? error : new Error(String(error)), { url: target });
            }
        }

        async fetchPage(url) {
            const { response, redirected } = await this.requestWithoutFollowingRedirects(url);
            if (redirected) throw Object.assign(new Error(t('errorRedirected')), { url: OttPlayerSite.siteUrl(url) });
            const html = await response.text();
            if (OttPlayerSite.isLoginPage(html)) throw new Error(t('errorSessionExpired'));
            return parseInertHtml(html);
        }

        postForm(url, data, { asAjax = false } = {}) {
            const headers = { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' };
            if (asAjax) headers['X-Requested-With'] = 'XMLHttpRequest';
            return this.requestWithoutFollowingRedirects(url, { method: 'POST', headers, body: $.param(data) });
        }

        /** the playlist page's own form#newChForm posts exactly these four fields; with the binding and 18+ fields added, one trial created nothing */
        createChannel({ playlistId, groupId, name, href }) {
            return this.postForm('/playlist/newchannel', { pl_id: playlistId, grp_id: groupId, name, href });
        }

        /** @see https://ottplayer.tv/public/js/main.js .delete_ch builds exactly this link for its confirm button */
        deleteChannel(channelId, playlistId) {
            return this.requestWithoutFollowingRedirects(`/channel/delete/${channelId}/${playlistId}`,
                { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
        }

        async searchLibrary(query) {
            const { response, redirected } = await this.postForm('/ajax/libch_srch', { ch_title: query }, { asAjax: true });
            if (redirected) throw new Error(t('errorSearchRedirected'));
            return LibraryResponse.parse(await response.text());
        }
    }

    class PlaylistPage {
        constructor(playlistId) {
            this.playlistId = playlistId;
        }

        static updateUrl() {
            return $('[name="update_url"]').val() || '';
        }

        static get GROUP_SWITCH() {
            return '.gr_sort li, #gr_box li, form a[href="#pl_channels"]';
        }

        static get DELETE_LINK() {
            return 'a.delete_ch';
        }

        allRows() {
            return $(`.sub_block_list ${ROW}`);
        }

        /** every group's rows are in the page at once; only the open group's pane carries .uk-active */
        openGroupRows() {
            return $(`.sub_block_list .uk-active ${ROW}`);
        }

        groupRows(groupId) {
            return PlaylistPage.groupRowsIn(document, groupId);
        }

        static groupRowsIn(doc, groupId) {
            return $(doc).find(`${PlaylistPage.groupListSelector(groupId)} ${ROW}`);
        }

        /** @see https://ottplayer.tv/public/js/playlist_page.js a group's channel list is #gp_<group id>: its drag-and-drop appends a moved channel there */
        static groupListSelector(groupId) {
            return `#gp_${$.escapeSelector(groupId)}`;
        }

        static groupIdOf($row) {
            return String($row.closest('ul[id^="gp_"]').attr('id') || '').slice(3) || null;
        }

        isInGroup(uuid, groupId) {
            return Boolean(groupId) && PlaylistPage.groupIdOf(this.rowById(uuid)) === groupId;
        }

        rowTitles() {
            return this.allRows().map((index, row) => ({ uuid: row.id, title: PlaylistPage.cachedTitleOf($(row)), groupId: PlaylistPage.groupIdOf($(row)) })).get();
        }

        cacheTitlesWithoutFreezing() {
            return inSlices(this.allRows().not('[data-om-title]').toArray(), row => PlaylistPage.cacheTitleOf($(row)));
        }

        /** @see https://ottplayer.tv/public/js/main.js the page binds its own handlers to each row once at load, so kept rows stay and only new ones come in */
        static updateGroupRowsFrom(doc, groupId) {
            const $list = $(PlaylistPage.groupListSelector(groupId));
            const $fresh = PlaylistPage.groupRowsIn(doc, groupId);
            const freshIds = new Set($fresh.map((index, row) => row.id).get());
            const keptIds = new Set($list.children(ROW).map((index, row) => row.id).get());
            $list.children(ROW).filter((index, row) => !freshIds.has(row.id)).remove();
            $fresh.filter((index, row) => !keptIds.has(row.id)).clone().attr('data-om-inserted', '').appendTo($list);
            PlaylistPage.recountGroup(groupId);
        }

        static isInsertedRow($row) {
            return $row.is('[data-om-inserted]');
        }

        /** @see https://ottplayer.tv/public/js/playlist_page.js its own move appends the row to the target list, so the page stays whole */
        static moveRowTo($row, groupId) {
            const $list = $(PlaylistPage.groupListSelector(groupId));
            if (!$list.length) {
                PlaylistPage.removeRow($row);
                return;
            }
            const fromId = PlaylistPage.groupIdOf($row);
            $row.children('.om-bar').remove();
            $row.appendTo($list);
            [fromId, groupId].filter(Boolean).forEach(id => PlaylistPage.recountGroup(id));
        }

        static removeRow($row) {
            const groupId = PlaylistPage.groupIdOf($row);
            $row.remove();
            if (groupId) PlaylistPage.recountGroup(groupId);
        }

        /** @see https://ottplayer.tv/public/js/playlist_page.js gpChsCnt: a group's count is its list's children, less the "create channel" entry */
        static recountGroup(groupId) {
            const $list = $(PlaylistPage.groupListSelector(groupId));
            if ($list.length) $(`#gpChsCnt_${$.escapeSelector(groupId)}`).text(`(${$list.children().length - 1})`);
        }

        rowOf(element) {
            return $(element).closest('.channel_item[id]');
        }

        rowById(uuid) {
            return $(`#${$.escapeSelector(uuid)}`);
        }

        channels($rows) {
            return $rows.toArray().map(row => this.channel($(row)));
        }

        channel($row) {
            const uuid = $row.attr('id');
            const editLink = $row.find('a[href*="/channel/edit/"]').first().attr('href');
            return {
                $row,
                uuid,
                title: PlaylistPage.cachedTitleOf($row),
                url: OttPlayerSite.siteUrl(editLink || `/channel/edit/${uuid}/${this.playlistId}`),
                libId: $row.attr('data-om-lib') || LibraryIcon.idOf(PlaylistPage.pageIconOf($row)),
                adult: $row.find('sup.adult').length > 0,
                groupId: PlaylistPage.groupIdOf($row),
            };
        }

        currentStateOf(channel) {
            const $row = this.rowById(channel.uuid);
            return $row.length ? this.channel($row) : channel;
        }

        static cachedTitleOf($row) {
            PlaylistPage.cacheTitleOf($row);
            return $row.attr('data-om-title');
        }

        static cacheTitleOf($row) {
            if ($row.attr('data-om-title') === undefined) $row.attr('data-om-title', PlaylistPage.visibleTitleOf($row));
        }

        static visibleTitleOf($row) {
            return $row.clone().find('.om-ui, sup').remove().end().text().replace(/\s+/g, ' ').trim();
        }

        static pageIconOf($row) {
            const $image = $row.find('img').not('.om-ic').first();
            return $image.attr('data-src') || $image.attr('src');
        }

        static showsNoBinding($row) {
            return !$row.attr('data-om-lib') && !LibraryIcon.idOf(PlaylistPage.pageIconOf($row));
        }

        static markAdult($row, adult) {
            const $mark = $row.find('sup.adult');
            if (adult && !$mark.length) {
                const $link = $row.find('a').first();
                ($link.length ? $link : $row).append('<sup class="adult">18+</sup>');
            }
            if (!adult) $mark.remove();
        }

        static markBinding($row, id) {
            $row.attr('data-om-lib', id);
        }

        deleteTargetOf($link) {
            return {
                channelId: $link.attr('data-chid'),
                playlistId: $link.attr('data-plid') || this.playlistId,
                name: $link.attr('data-chname') || '',
            };
        }

        static replaceListsFrom(doc) {
            const $fresh = $(doc);
            for (const selector of ['#pl_channels', '#gr_box', '.sub_block_list']) {
                const $current = $(selector).first();
                const $replacement = $fresh.find(selector).first();
                const replacedWithItsParent = selector !== '#pl_channels' && $current.closest('#pl_channels').length > 0;
                if ($current.length && $replacement.length && !replacedWithItsParent) $current.html($replacement.html());
            }
        }

        groups() {
            const byId = new Map();
            $('#gr_box li.drop_inn, .gr_sort li').each((index, element) => {
                const $tab = $(element);
                const $link = PlaylistPage.groupLinkOf($tab);
                const id = (String($tab.attr('data-target') || $link.attr('href') || '').match(/\d+/) || [])[0];
                const active = $tab.hasClass('uk-active') || $tab.find('.uk-active').length > 0;
                if (!id) return;
                if (byId.has(id)) {
                    byId.get(id).active = byId.get(id).active || active;
                } else {
                    byId.set(id, { id, $tab, $link, active, title: PlaylistPage.groupTitleOf($link) });
                }
            });
            return [...byId.values()];
        }

        static groupLinkOf($tab) {
            const $named = $tab.find('a.no_transform').first();
            return $named.length ? $named : $tab.find('a').first();
        }

        static groupTitleOf($link) {
            return $link.clone().children().remove().end().text().trim();
        }

        activeGroup() {
            return this.groups().find(group => group.active) || null;
        }

        groupById(id) {
            return this.groups().find(group => group.id === id) || null;
        }

        groupsByTitle() {
            return new Map(this.groups().map(group => [groupKey(group.title), group]));
        }

        async openGroup(group, isStopped) {
            if (this.isOpen(group)) return true;
            const rowIdsBefore = new Set(this.openRowIds());
            const opened = () => this.isOpen(group) || this.openRowsReplaced(rowIdsBefore);
            for (const click of [() => PlaylistPage.clickGroup(group), () => PlaylistPage.clickGroupLinkNatively(group)]) {
                if (isStopped()) return false;
                click();
                if (await waitUntil(opened, isStopped)) {
                    await waitUntil(() => this.openGroupRows().length > 0, isStopped);
                    return true;
                }
            }
            return false;
        }

        isOpen(group) {
            const current = this.groupById(group.id);
            return Boolean(current && current.active);
        }

        openRowIds() {
            return this.openGroupRows().map((index, row) => row.id).get();
        }

        openRowsReplaced(rowIdsBefore) {
            const ids = this.openRowIds();
            return rowIdsBefore.size ? ids.every(id => !rowIdsBefore.has(id)) : ids.length > 0;
        }

        static clickGroup(group) {
            (group.$link.length ? group.$link : group.$tab).trigger('click');
        }

        /** UIkit listens to the tab natively, which the jQuery click before this one does not reach */
        static clickGroupLinkNatively(group) {
            if (PlaylistPage.isInPageLink(group.$link)) clickNatively(group.$link);
        }

        static isInPageLink($link) {
            return /^(#|$)/.test($link.attr('href') || '');
        }
    }

    class ChannelEditor {
        constructor(site, decisions, playlistId, log) {
            this.site = site;
            this.decisions = decisions;
            this.playlistId = playlistId;
            this.log = log;
            this.firstSaveReadBack = false;
        }

        async readForm(channel) {
            const form = ChannelEditor.serialize(await this.site.fetchPage(channel.url));
            if (!form) throw new Error(t('errorFormNotFound'));
            return form;
        }

        async readFormAndLearnRow(channel) {
            const form = await this.readForm(channel);
            this.decisions.learnRowCode(channel, SourcePlaylist.channelCode(form.href));
            this.decisions.learnRowBinding(channel, form.libchannel_id);
            return form;
        }

        /** a save rewrites the whole channel, stream address included, so the whole form goes back */
        async write(channel, wanted) {
            try {
                const current = await this.readFormAndLearnRow(channel);
                const written = ChannelEditor.fieldsDiffering(current, wanted);
                if (written.length) {
                    await this.site.postForm(channel.url, this.postBody(current, wanted));
                    if ('libchannel_id' in wanted) this.decisions.learnRowBinding(channel, wanted.libchannel_id);
                    await this.readBackFirstSave(channel, wanted);
                }
                return written;
            } catch (error) {
                throw Object.assign(error, { channelTitle: channel.title });
            }
        }

        postBody(current, wanted) {
            const body = Object.assign({}, current, wanted);
            body.playlist_id = body.playlist_id || this.playlistId;
            return body;
        }

        /** the redirect a save answers with carries no body, so the first save of a session is read back once */
        async readBackFirstSave(channel, wanted) {
            if (this.firstSaveReadBack) return;
            this.firstSaveReadBack = true;
            try {
                const notApplied = ChannelEditor.fieldsDiffering(await this.readForm(channel), wanted);
                if (notApplied.length) {
                    this.log(t('firstSaveNotApplied', { fields: notApplied.join(', ') }), 'err');
                } else {
                    this.log(t('firstSaveVerified'), 'ok');
                }
            } catch (error) {
                this.log(t('firstSaveUnverified', { error: describeError(error) }), 'warn');
            }
        }

        static fieldsDiffering(form, wanted) {
            return Object.keys(wanted).filter(field => String(form[field]) !== String(wanted[field]));
        }

        static serialize(doc) {
            const $form = ChannelEditor.channelFormOf(doc);
            if (!$form.length) return null;
            const fields = {};
            $form.find('input[name], select[name], textarea[name]').each((index, control) => ChannelEditor.collect(fields, control));
            return fields;
        }

        static channelFormOf(doc) {
            const $withChannelFields = $(doc).find('form')
                .filter((index, form) => $(form).find('[name="libchannel_id"], [name="ch_title"]').length > 0)
                .first();
            return $withChannelFields.length ? $withChannelFields : $(doc).find('form[action*="/channel/edit/"]').first();
        }

        static collect(fields, control) {
            if (control.type !== 'checkbox' && control.type !== 'radio') {
                fields[control.name] = $(control).val() || '';
            } else if (control.checked) {
                fields[control.name] = control.value || 'on';
            } else if (!(control.name in fields)) {
                fields[control.name] = '';
            }
        }
    }

    const Step = Object.freeze({ CHANGED: 'changed', UNCHANGED: 'unchanged', SKIPPED: 'skipped', FAILED: 'failed' });

    class BatchRunner {
        constructor(panel) {
            this.panel = panel;
            this.generation = 0;
            this.reportedGeneration = 0;
            this.queue = Promise.resolve();
        }

        /** Stop ends whatever started before it, and nothing that starts after it */
        stop() {
            this.generation++;
            this.panel.status(t('stopping'));
        }

        stoppedSince(generation) {
            return this.generation !== generation;
        }

        stoppedAndReportedSince(generation) {
            if (!this.stoppedSince(generation)) return false;
            if (this.reportedGeneration !== this.generation) this.panel.log(t('stopped'), 'warn');
            this.reportedGeneration = this.generation;
            return true;
        }

        /** writing batches queue up, because two read-modify-writes of one channel must never interleave */
        run(label, items, step, { summary = true, readOnly = false } = {}) {
            const generation = this.generation;
            const start = () => this.runNow(label, items, step, summary, generation);
            if (readOnly) return start();
            const done = this.queue.then(start);
            this.queue = done.catch(() => null);
            return done;
        }

        async runNow(label, items, step, summary, generation) {
            const tally = { [Step.CHANGED]: 0, [Step.UNCHANGED]: 0, [Step.SKIPPED]: 0, [Step.FAILED]: 0 };
            for (const [index, item] of items.entries()) {
                if (this.stoppedAndReportedSince(generation)) break;
                this.panel.status(`${label} ${index + 1}/${items.length}`);
                const outcome = await this.attempt(step, item, tally[Step.FAILED]);
                tally[outcome]++;
                if (outcome !== Step.SKIPPED) await sleep(REQUEST_DELAY_MS);
            }
            this.panel.status('');
            if (summary && items.length > 1) this.panel.log(BatchRunner.summary(label, items.length, tally));
            return tally;
        }

        async attempt(step, item, failuresSoFar) {
            try {
                return await step(item);
            } catch (error) {
                if (failuresSoFar < 3) this.panel.logFailure(`⚠ ${[error.channelTitle, describeError(error)].filter(Boolean).join(': ')}`, error);
                return Step.FAILED;
            }
        }

        static summary(label, total, tally) {
            const unchanged = tally[Step.UNCHANGED] + tally[Step.SKIPPED];
            return [
                t('batchChanged', { label, changed: tally[Step.CHANGED], total }),
                unchanged && t('batchUnchanged', { count: unchanged }),
                tally[Step.FAILED] && t('batchFailed', { count: tally[Step.FAILED] }),
            ].filter(Boolean).join(', ');
        }
    }

    class Panel {
        mount({ actions, takeover, onProfileChange, onTakeoverChange }) {
            $('<style>').text(Panel.STYLE).appendTo('head');
            this.$root = $(Panel.markup()).appendTo('body');
            this.$log = this.$root.find('.om-log');
            this.$status = this.$root.find('.om-status');
            this.$head = this.$root.find('.om-head');
            this.$profiles = this.$root.find('.om-profile');
            this.headText = '';
            this.profilesSignature = '';
            this.$root.find('.om-actions').append(actions.map(row => $('<div class="om-row">').append(row.map(Panel.button))));
            this.$root.find('.om-min').on('click', () => this.$root.find('.om-body').toggle());
            this.$profiles.on('change', event => onProfileChange($(event.target).val()));
            this.$root.find('.om-takeover').prop('checked', takeover).on('change', event => onTakeoverChange(event.target.checked));
            return this;
        }

        static button({ action, hint, style = '', run }) {
            return $('<button type="button" class="om-p">')
                .addClass(style)
                .attr({ 'data-om-action': action, title: hint ? t(hint) : '' })
                .text(t(action))
                .on('click', run);
        }

        log(text, kind = '') {
            this.$log.append($('<div class="om-line">').addClass(kind && `om-${kind}`).text(text));
            const extra = this.$log.children().length - LOG_LIMIT;
            if (extra > 0) this.$log.children().slice(0, extra).remove();
            this.$log.scrollTop(this.$log.prop('scrollHeight'));
        }

        logFailure(message, error) {
            this.log(message, 'err');
            if (error.url) this.log(error.url, 'code');
        }

        /** UIkit.notification takes its message as HTML */
        logAndToast(text, kind) {
            this.log(text, kind);
            const uikit = pageWindow.UIkit;
            if (uikit && uikit.notification) uikit.notification(escapeHtml(text), { status: kind === 'warn' ? 'warning' : 'success', pos: 'top-center' });
        }

        status(text) {
            this.$status.text(text || '');
        }

        showHeader(lines, needsAttention) {
            const text = lines.join('\n');
            if (text === this.headText) return;
            this.headText = text;
            this.$head.toggleClass('om-attention', needsAttention).empty().append(lines.map(line => $('<div>').text(line)));
        }

        /** rebuilt only on change: rebuilding the select would close it under the user's pointer */
        showProfiles(profiles, current) {
            const signature = profiles.map(profile => `${profile.name}:${profile.byTitle}:${profile.byCode}`).join('|') + `>${current}`;
            if (signature === this.profilesSignature) return;
            this.profilesSignature = signature;
            this.$profiles.empty().append(profiles.map(profile => $('<option>')
                .val(profile.name)
                .prop('selected', profile.name === current)
                .text(t('profileOption', profile))));
        }

        static markup() {
            return `
                <div id="om-panel">
                    <h4>${escapeHtml(t('panelTitle'))} <span class="om-min" title="${escapeHtml(t('collapse'))}">&#8211;</span></h4>
                    <div class="om-body">
                        <div class="om-head"></div>
                        <label class="om-chk">${escapeHtml(t('profile'))}
                            <select class="om-profile" title="${escapeHtml(t('profileHint'))}"></select>
                        </label>
                        <div class="om-actions"></div>
                        <label class="om-chk"><input type="checkbox" class="om-takeover"> ${escapeHtml(t('takeover'))}</label>
                        <div class="om-status"></div>
                        <div class="om-log"></div>
                    </div>
                </div>`;
        }

        static get STYLE() {
            return `
#om-panel{position:fixed;right:10px;bottom:10px;z-index:99998;width:390px;max-height:80vh;display:flex;flex-direction:column;
  font:12px/1.45 system-ui,sans-serif;color:#18202a;background:#fff;border:1px solid #c5ccd3;border-radius:10px;
  box-shadow:0 8px 30px rgba(0,0,0,.24)}
#om-panel h4{margin:0;padding:8px 11px;font-size:11px;letter-spacing:.07em;text-transform:uppercase;background:#1d2a38;
  color:#fff;border-radius:9px 9px 0 0;display:flex;justify-content:space-between}
#om-panel .om-min{cursor:pointer;opacity:.8}
#om-panel .om-body{padding:9px 11px;display:flex;flex-direction:column;gap:7px;overflow:auto}
#om-panel .om-head{font-size:11px;color:#41505f;background:#f2f5f8;border-radius:6px;padding:6px 8px}
#om-panel .om-head.om-attention{box-shadow:inset 3px 0 0 #c2410c}
#om-panel .om-actions{display:flex;flex-direction:column;gap:7px}
#om-panel .om-row{display:flex;gap:5px;flex-wrap:wrap}
#om-panel .om-p{font:11px system-ui;padding:5px 8px;border:1px solid #b6bec6;border-radius:6px;background:#f7f8f9;cursor:pointer}
#om-panel .om-p:hover{background:#eceff1}
#om-panel .om-p.pri{background:#1f6feb;border-color:#1a5fce;color:#fff}
#om-panel .om-p.dng{background:#c62828;border-color:#a91f1f;color:#fff}
#om-panel .om-chk{display:flex;align-items:center;gap:6px;font-size:11px;color:#41505f}
#om-panel .om-profile{flex:1;min-width:0;font:11px system-ui;padding:3px 5px;border:1px solid #b6bec6;border-radius:5px;background:#fff}
#om-panel .om-status{font-size:11px;color:#5a6672;min-height:1.2em}
#om-panel .om-log{background:#0f1720;color:#dbe4ec;border-radius:6px;padding:6px 8px;max-height:190px;overflow:auto;
  font:11px/1.5 ui-monospace,Menlo,Consolas,monospace}
#om-panel .om-line{padding:1px 0;border-bottom:1px solid rgba(255,255,255,.05);word-break:break-word}
#om-panel .om-ok{color:#b8e6c8}#om-panel .om-warn{color:#ffd479}#om-panel .om-err{color:#ff9090}#om-panel .om-code{color:#9fd0ff}
.om-bar,.om-gbar{display:inline-flex;align-items:center;gap:4px;margin-left:8px;vertical-align:middle}
.om-bar{padding:2px 6px;border-radius:6px;border:1px solid transparent}
.om-bound{background:#eafaf0;border-color:#bfe6cd}
.om-unbound{background:#fdeaea;border-color:#f3c2c2}
.om-noch{background:#eef1f4;border-color:#d3dae0}
.om-pending{background:#fff6e0;border-color:#f0dca8}
.om-locked{box-shadow:inset 3px 0 0 #c62828}
.om-ic{width:22px;height:22px;object-fit:contain;background:#fff;border-radius:3px}
.om-id{font:10px ui-monospace,monospace;color:#5a6672;min-width:2.6em}
.om-b{display:inline-flex;align-items:center;font:10px system-ui;padding:2px 6px;border:1px solid #b6bec6;
  border-radius:5px;background:#fff;cursor:pointer;white-space:nowrap}
.om-b:hover{background:#eef1f4}
.om-b svg,.om-b img{display:block}
.om-set-noch{gap:4px;padding:1px 5px;border-style:dashed}
.om-adult{color:#8a949d}
.om-adult.on{background:#c62828;border-color:#a91f1f;color:#fff}
.om-gmenu{font-size:13px;line-height:1;padding:1px 7px}
.om-b.om-star{padding:0 3px;border:0;background:none;font-size:15px;line-height:1;color:#8a949d;opacity:.4}
.om-b.om-star.on{color:#f5b301;opacity:1}
.om-b.om-star:disabled{cursor:help;opacity:.2}
.om-b.om-star.om-alone{outline:1px dashed #f5b301;outline-offset:1px;border-radius:3px}
.om-fav{background:rgba(245,179,1,.14);box-shadow:inset 3px 0 0 #f5b301}
.om-fav>a.no_transform::after{content:' ★';color:#f5b301}
.om-menu{position:absolute;z-index:100001;width:280px;margin:0;padding:4px;list-style:none;background:#fff;color:#18202a;
  border:1px solid #c5ccd3;border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,.2);font:12px/1.35 system-ui,sans-serif;outline:none}
.om-menu li{padding:6px 9px;border-radius:6px;cursor:pointer}
.om-menu li:hover,.om-menu li.ui-state-focus{background:#eef3fb}
.om-mt{font-weight:600}
.om-md{margin-top:1px;font-size:11px;color:#5a6672}
@keyframes om-pulse{50%{opacity:.35}}
@keyframes om-spin{to{transform:rotate(360deg)}}
.om-busy>.om-bar,.om-busy>.om-gbar{animation:om-pulse .9s ease-in-out infinite}
.om-spin::before{content:'';display:inline-block;width:9px;height:9px;margin-right:6px;vertical-align:-1px;
  border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:om-spin .7s linear infinite}
@media (prefers-reduced-motion:reduce){.om-busy>.om-bar,.om-busy>.om-gbar,.om-spin::before{animation:none}}
.om-grp{max-width:160px;font:10px system-ui;padding:2px 4px;border:1px solid #b6bec6;border-radius:5px;background:#fff}
.om-noart{opacity:.45}
.om-modal{position:fixed;inset:0;z-index:100000;background:rgba(12,18,25,.55);display:flex;align-items:center;
  justify-content:center;padding:24px}
.om-dlg{width:min(860px,96vw);max-height:86vh;background:#fff;border-radius:12px;display:flex;flex-direction:column;
  box-shadow:0 22px 70px rgba(0,0,0,.4);overflow:hidden;font:13px/1.45 system-ui,sans-serif;color:#18202a}
.om-h{display:flex;gap:8px;align-items:center;padding:12px 14px;border-bottom:1px solid #e6eaee;background:#f8fafb}
.om-h-t{font-weight:600;max-width:30%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.om-q{flex:1;padding:7px 11px;border:1px solid #c5ccd3;border-radius:7px;font:13px system-ui}
.om-q:focus{outline:none;border-color:#1f6feb;box-shadow:0 0 0 3px rgba(31,111,235,.15)}
.om-hint{padding:5px 14px;font-size:11px;color:#68727d;background:#f8fafb;border-bottom:1px solid #eef2f5;min-height:1.4em}
.om-current{display:flex;align-items:center;gap:9px;padding:6px 14px;border-bottom:1px solid #eef2f5;font-size:12px}
.om-current img{width:28px;height:28px;object-fit:contain;background:#fff;border-radius:4px}
.om-cur-l{color:#68727d}
.om-it.om-cur{border-color:#1f6feb;background:#e7f0ff}
.om-check{color:#1f6feb;font-weight:700}
.om-dissolve .uk-select{margin:4px 0 12px}
.om-dissolve progress{width:100%}
.om-dlg.om-small{width:min(480px,96vw);padding:18px 20px;gap:10px}
.om-list{overflow:auto;padding:10px 12px;display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:7px}
.om-it{display:flex;align-items:center;gap:11px;padding:7px 11px;border:1px solid #d9ecdf;border-radius:8px;background:#eefaf1;cursor:pointer}
.om-it:hover{background:#dff3e7;border-color:#1f6feb}
.om-it img{width:40px;height:40px;object-fit:contain;background:#fff;border-radius:5px;flex:0 0 auto}
.om-nm{flex:1;line-height:1.3;word-break:break-word}
.om-eid{font:11px ui-monospace,monospace;color:#7b8794}
.om-empty,.om-relax{grid-column:1/-1}
.om-empty{padding:26px;text-align:center;color:#6b7680}
.om-relax{padding:7px 10px;border-radius:7px;background:#fff6e0;border:1px solid #f0dca8;color:#7a5b12;font-size:12px}`;
        }
    }

    class GroupMenu {
        constructor() {
            this.$menu = null;
            this.$button = null;
            this.usesWidget = false;
            this.onChoose = () => null;
        }

        mount() {
            this.usesWidget = GroupMenu.widgetAvailable();
            this.$menu = $('<ul class="om-ui om-menu">').hide().appendTo('body');
            if (this.usesWidget) {
                this.$menu.menu({ select: (event, ui) => this.choose(ui.item) });
            } else {
                this.$menu.on('click', 'li', event => this.choose($(event.currentTarget)));
            }
            $(document)
                .on('mousedown', event => this.closeUnlessInside(event.target))
                .on('keydown', event => this.closeOnEscape(event));
        }

        static widgetAvailable() {
            return Boolean($.fn.menu);
        }

        static item(action, titleKey, hintKey) {
            return $('<li>').attr('data-om-action', action)
                .append($('<div class="om-mt">').text(t(titleKey)), $('<div class="om-md">').text(t(hintKey)));
        }

        open($button, items, onChoose) {
            this.$button = $button;
            this.onChoose = onChoose;
            this.$menu.empty().append(items).show();
            if (this.usesWidget) this.$menu.menu('refresh');
            this.placeBelow($button);
            this.$menu.trigger('focus');
        }

        /** jQuery UI 1.11.2's position() throws beside the page's jQuery 3.3.1: it asks for $(window).offset() */
        placeBelow($button) {
            const offset = $button.offset();
            const rightmost = $(window).scrollLeft() + $(window).width() - this.$menu.outerWidth() - 8;
            this.$menu.offset({ left: Math.max(0, Math.min(offset.left, rightmost)), top: offset.top + $button.outerHeight() + 2 });
        }

        choose($item) {
            this.close();
            this.onChoose($item.attr('data-om-action'));
        }

        isOpen() {
            return this.$menu.is(':visible');
        }

        close() {
            this.$menu.hide();
        }

        closeUnlessInside(target) {
            if (this.isOpen() && !$(target).closest(this.$menu).length) this.close();
        }

        closeOnEscape(event) {
            if (event.key !== 'Escape' || !this.isOpen()) return;
            this.close();
            this.$button.trigger('focus');
        }
    }

    class PlaylistView {
        constructor(page, decisions, library, panel, menu) {
            this.page = page;
            this.decisions = decisions;
            this.library = library;
            this.panel = panel;
            this.menu = menu;
        }

        mount(handlers) {
            this.handlers = handlers;
            this.menu.mount();
            $(document)
                .on('click', '.om-bar [data-om-action]', event => this.handleRowButton(event))
                .on('click', '.om-gbar [data-om-action]', event => this.handleGroupButton(event))
                .on('click', PlaylistPage.GROUP_SWITCH, () => this.redecorateAfterGroupSwitch());
            LibraryIcon.replaceMissingWithPlaceholder();
            this.showKnownNoChannelRows();
            this.redecorateWhenPageAddsElements();
            setTimeout(() => {
                this.showKnownNoChannelRows();
                this.redecorateAll();
            }, 600);
        }

        showKnownNoChannelRows() {
            this.page.allRows().each((index, row) => {
                if (PlaylistPage.showsNoBinding($(row)) && this.decisions.isKnownNoChannel(row.id)) PlaylistPage.markBinding($(row), NO_CHANNEL);
            });
        }

        handleRowButton(event) {
            event.preventDefault();
            event.stopPropagation();
            const $button = $(event.currentTarget);
            const $row = this.page.rowOf($button);
            const action = $button.attr('data-om-action');
            if ($row.hasClass('om-busy')) return;
            if (action === 'chooseGroup') {
                this.showMoveSelect($row, $button);
            } else {
                this.whileWorking($row, this.handlers[action]($row));
            }
        }

        handleGroupButton(event) {
            event.preventDefault();
            event.stopPropagation();
            const $button = $(event.currentTarget);
            const group = this.page.groupById($button.closest('.om-gbar').attr('data-gid'));
            if (group) this.menu.open($button, this.groupMenuItems(group), action => this.runGroupAction(action, group.id));
        }

        groupMenuItems(group) {
            const items = [
                GroupMenu.item('lockGroup', 'groupLock', 'groupLockHint'),
                GroupMenu.item('unlockGroup', 'groupUnlock', 'groupUnlockHint'),
                GroupMenu.item('noChannel', 'groupNoChannel', 'groupNoChannelHint'),
            ];
            if (this.decisions.isFavouriteGroup(group.id)) {
                return items.concat(
                    GroupMenu.item('updateCopies', 'groupUpdateCopies', 'groupUpdateCopiesHint'),
                    GroupMenu.item('clearFavourite', 'groupUnfavourite', 'groupUnfavouriteHint'));
            }
            return items.concat(
                GroupMenu.item('dissolveGroup', 'groupDissolve', 'groupDissolveHint'),
                GroupMenu.item('setFavourite', 'groupFavourite', 'groupFavouriteHint'));
        }

        runGroupAction(action, groupId) {
            const group = this.page.groupById(groupId);
            if (group) this.whileWorking(group.$tab, this.handlers[action](group));
        }

        /** work inside work leaves the mark to the outer one, which ends last */
        async whileWorking($element, work) {
            if ($element.hasClass('om-busy')) return work;
            $element.addClass('om-busy');
            try {
                return await work;
            } finally {
                $element.removeClass('om-busy');
            }
        }

        /** the page re-renders its lists; our own inserts are ignored, or decorating would feed itself */
        redecorateWhenPageAddsElements() {
            const decorateSoon = throttle(() => this.decorateNewRows(), DECORATE_THROTTLE_MS);
            new MutationObserver(records => PlaylistView.pageAddedElements(records) && decorateSoon())
                .observe(document.body, { childList: true, subtree: true });
        }

        static pageAddedElements(records) {
            return records.some(record => !$(record.target).closest(OWN_UI).length && $(record.addedNodes).not(OWN_UI).length > 0);
        }

        /** a group switch only moves .uk-active, which the observer does not watch */
        redecorateAfterGroupSwitch() {
            GROUP_SWITCH_REDECORATE_MS.forEach(ms => setTimeout(() => this.decorateNewRows(), ms));
        }

        decorateNewRows() {
            this.decorate(this.page.openGroupRows().filter((index, row) => !$(row).children('.om-bar').length));
        }

        redecorateAll() {
            this.dropBarsOfClosedGroups();
            this.decorate(this.page.openGroupRows());
        }

        dropBarsOfClosedGroups() {
            this.page.allRows().not(this.page.openGroupRows()).children('.om-bar').remove();
        }

        async decorate($rows) {
            if ($rows.length) {
                if (this.favouriteGroup()) await this.page.cacheTitlesWithoutFreezing();
                const favourites = this.favouriteIndex();
                await inSlices($rows.toArray(), row => this.decorateRow($(row), favourites));
            }
            this.decorateGroups();
            this.updateHeader();
        }

        redrawRow($row) {
            if ($row.children('.om-bar').length) this.decorateRow($row, this.favouriteIndex());
        }

        decorateRow($row, favourites) {
            $row.children('.om-bar').remove();
            const channel = this.page.channel($row);
            const $bar = $('<span class="om-ui om-bar">')
                .addClass(this.stateOf(channel))
                .toggleClass('om-locked', channel.adult)
                .append(PlaylistView.bindingOf(channel))
                .append(PlaylistView.button('pick', 'om-pick', t('pickHint'), t('pick')))
                .append(PlaylistView.button('toggleAdult', `om-adult${channel.adult ? ' on' : ''}`,
                    t(channel.adult ? 'lockRemove' : 'lockSet'), PlaylistView.lock(channel.adult)))
                .append(PlaylistView.button('chooseGroup', 'om-mv', t('moveHint'), '&#8644;'));
            if (favourites) $bar.append(PlaylistView.starButtonOf(channel, favourites));
            $bar.appendTo($row);
        }

        favouriteGroup() {
            return this.page.groupById(this.decisions.favouriteGroupId());
        }

        favouriteIndex() {
            const group = this.favouriteGroup();
            return group ? Object.assign({ group }, FavouriteCopies.indexOf(this.page.rowTitles(), group.id)) : null;
        }

        static starButtonOf(channel, favourites) {
            const star = FavouriteCopies.starOf(channel, favourites);
            const hint = t(FavouriteCopies.hintOf(star), { title: channel.title, group: favourites.group.title });
            return PlaylistView.button('toggleStar', 'om-star', hint, '★')
                .toggleClass('on', star === Star.ON || star === Star.ALONE)
                .toggleClass('om-alone', star === Star.ALONE)
                .prop('disabled', star === Star.AMBIGUOUS);
        }

        /** an unbound row offers "no channel" right where its binding would be: one click instead of the picker */
        static bindingOf(channel) {
            if (!channel.libId) {
                return PlaylistView.button('setNoChannel', 'om-set-noch', t('noChannelHint'),
                    [LibraryIcon.img(NO_CHANNEL, 'om-ic'), $('<span class="om-id">').text('—')]);
            }
            return [LibraryIcon.img(channel.libId, 'om-ic'), $('<span class="om-id">').text(channel.libId)];
        }

        stateOf(channel) {
            if (size(this.decisions.pendingChanges(channel))) return 'om-pending';
            if (!channel.libId) return 'om-unbound';
            return channel.libId === NO_CHANNEL ? 'om-noch' : 'om-bound';
        }

        decorateGroups() {
            this.page.groups().forEach(group => this.decorateGroup(group));
        }

        decorateGroup(group) {
            group.$tab.toggleClass('om-fav', this.decisions.isFavouriteGroup(group.id));
            if (group.$tab.children('.om-gbar').length) return;
            $('<span class="om-ui om-gbar">')
                .attr('data-gid', group.id)
                .append(PlaylistView.button('groupMenu', 'om-gmenu', t('groupMenuHint'), '&#8942;'))
                .appendTo(group.$tab);
        }

        showMoveSelect($row, $button) {
            const open = this.page.activeGroup();
            const $select = $('<select class="om-grp">').append($('<option value="">').text(t('moveTo')));
            this.page.groups()
                .filter(group => !open || group.id !== open.id)
                .forEach(group => $select.append($('<option>').val(group.id).text(group.title)));
            $button.replaceWith($select);
            $select.on('change', () => this.moveToChosenGroup($row, $select.val()));
            $select.on('blur', () => setTimeout(() => {
                if (!$select.val()) this.redrawRow($row);
            }, 200));
            $select.trigger('focus');
            PlaylistView.tryShowPicker($select);
        }

        static tryShowPicker($select) {
            try {
                $select[0].showPicker();
            } catch (focusedIsEnough) {
                return;
            }
        }

        async moveToChosenGroup($row, groupId) {
            const group = this.page.groupById(groupId);
            if (group) await this.whileWorking($row, this.handlers.moveTo($row, group));
            this.redrawRow($row);
        }

        showSaved(channel, wanted, written) {
            const $row = this.page.rowById(channel.uuid);
            if ('adult' in wanted) PlaylistPage.markAdult($row, wanted.adult === '1');
            if ('libchannel_id' in wanted) PlaylistPage.markBinding($row, wanted.libchannel_id);
            if (written.includes('group_id')) PlaylistPage.moveRowTo($row, wanted.group_id);
        }

        updateHeader() {
            this.panel.showProfiles(this.decisions.profileSummaries(), this.decisions.profile.name);
            const stats = this.openGroupStats();
            this.panel.showHeader([
                t('headerProfile', {
                    profile: this.decisions.profile.name,
                    byTitle: size(this.decisions.byTitle()),
                    byCode: size(this.decisions.byCode()),
                    library: this.library.size,
                    probes: this.library.probeCount,
                }),
                t('headerGroup', Object.assign({ all: this.page.allRows().length }, stats)),
            ], stats.pending > 0);
        }

        openGroupStats() {
            const stats = { total: 0, withCode: 0, unbound: 0, noChannel: 0, adult: 0, pending: 0 };
            this.page.channels(this.page.openGroupRows()).forEach(channel => {
                stats.total++;
                stats.withCode += this.decisions.codeOf(channel) ? 1 : 0;
                stats.unbound += channel.libId ? 0 : 1;
                stats.noChannel += channel.libId === NO_CHANNEL ? 1 : 0;
                stats.adult += channel.adult ? 1 : 0;
                stats.pending += size(this.decisions.pendingChanges(channel)) ? 1 : 0;
            });
            return stats;
        }

        static button(action, cls, title, content) {
            return $('<button type="button" class="om-b">').addClass(cls).attr({ 'data-om-action': action, title }).append(content);
        }

        static lock(closed) {
            const shackle = closed ? 'M5.5 7V5a2.5 2.5 0 0 1 5 0v2' : 'M5.5 7V5a2.5 2.5 0 0 1 5 0';
            return `<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
                <rect x="3" y="7" width="10" height="7" rx="1.5" fill="currentColor"></rect>
                <path d="${shackle}" fill="none" stroke="currentColor" stroke-width="1.5"></path></svg>`;
        }
    }

    class LibraryPicker {
        constructor(library, onChoose) {
            this.library = library;
            this.onChoose = onChoose;
            this.inflight = new Set();
            this.probeTimer = null;
            this.$modal = null;
        }

        open(channel) {
            this.close();
            this.channel = channel;
            this.$modal = $(LibraryPicker.markup(channel.title)).appendTo('body');
            this.$query = this.$modal.find('.om-q').val(ChannelTitle.startPhrase(channel.title));
            this.$hint = this.$modal.find('.om-hint');
            this.$current = this.$modal.find('.om-current');
            this.$list = this.$modal.find('.om-list');
            this.attachEventHandlers();
            this.showCurrentBinding();
            this.showResults();
            this.showHint();
            this.requestMissingProbes(this.$query.val());
            setTimeout(() => this.$query.trigger('focus').select(), 30);
        }

        showCurrentBinding() {
            const id = this.channel.libId || '';
            const $label = $('<span class="om-cur-l">').text(t('currentBinding'));
            if (!id) {
                this.$current.empty().append($label, $('<span class="om-nm">').text(t('currentUnbound')));
                return;
            }
            this.$current.empty().append($label, LibraryIcon.img(id),
                $('<span class="om-nm">').text(this.bindingNameOf(id)), $('<span class="om-eid">').text(`#${id}`));
        }

        bindingNameOf(id) {
            return id === NO_CHANNEL ? t('noChannelName') : this.library.nameOf(id);
        }

        attachEventHandlers() {
            this.$query.on('input', () => {
                this.showResults();
                clearTimeout(this.probeTimer);
                this.probeTimer = setTimeout(() => this.requestMissingProbes(this.$query.val()), 400);
            });
            this.$query.on('keydown', event => this.handleKey(event));
            this.$modal.on('click', '.om-it', event => this.choose($(event.currentTarget)));
            this.$modal.on('click', '.om-none', () => this.chooseNoChannel());
            this.$modal.on('click', '.om-close', () => this.close());
            this.$modal.on('click', event => {
                if (event.target === event.currentTarget) this.close();
            });
        }

        handleKey(event) {
            const $first = this.$list.find('.om-it').first();
            if (event.key === 'Escape') this.close();
            if (event.key === 'Enter' && $first.length) this.choose($first);
        }

        choose($item) {
            this.onChoose(this.channel.$row, String($item.attr('data-id')), $item.attr('data-name'));
            this.close();
        }

        chooseNoChannel() {
            this.onChoose(this.channel.$row, NO_CHANNEL, t('noChannelName'));
            this.close();
        }

        close() {
            clearTimeout(this.probeTimer);
            if (this.$modal) this.$modal.remove();
            this.$modal = null;
        }

        isOpen() {
            return Boolean(this.$modal);
        }

        showResults() {
            const text = this.$query.val();
            if (!ChannelTitle.words(text).length) {
                this.render([], [], t('typeToSearch'));
                return;
            }
            const { words, used, hits } = this.library.search(text);
            if (!hits.length) {
                this.render([], [], t('nothingFoundEvenFor', { word: words[0] }));
                return;
            }
            this.render(hits.slice(0, PICKER_LIMIT), LibraryPicker.notesFor(words, used, hits.length));
        }

        static notesFor(words, used, total) {
            const notes = [];
            if (used.length < words.length) notes.push(t('relaxedQuery', { query: words.join(' '), used: used.join(' ') }));
            if (total > PICKER_LIMIT) notes.push(t('truncatedResults', { total, limit: PICKER_LIMIT }));
            return notes;
        }

        render(entries, notes, emptyText = '') {
            this.$list.empty();
            if (notes.length) this.$list.append($('<div class="om-relax">').text(notes.join('. ')));
            if (entries.length) {
                this.$list.append(entries.map(entry => LibraryPicker.resultOf(entry, this.channel.libId)));
            } else {
                this.$list.append($('<div class="om-empty">').text(emptyText));
            }
        }

        static resultOf(entry, currentId) {
            const $result = $('<div class="om-it">')
                .attr({ 'data-id': entry.id, 'data-name': entry.name })
                .append(LibraryIcon.img(entry.id))
                .append($('<span class="om-nm">').text(entry.name || `#${entry.id}`));
            if (entry.id === currentId) $result.addClass('om-cur').append($('<span class="om-check">').text('✓'));
            return $result.append($('<span class="om-eid">').text(entry.id));
        }

        async requestMissingProbes(text) {
            const probes = this.library.unprobed(LibraryIndex.probesFor(text)).filter(probe => !this.inflight.has(probe));
            if (!probes.length) return;
            const $hint = this.$hint;
            probes.forEach(probe => this.inflight.add(probe));
            $hint.addClass('om-spin').text(t('requesting', { probes: probes.join(', ') }));
            await this.library.collect(probes);
            probes.forEach(probe => this.inflight.delete(probe));
            if (!this.isOpen()) return;
            this.showResults();
            this.showCurrentBinding();
            this.showHint(this.$hint === $hint ? probes : []);
        }

        showHint(addedFrom = []) {
            const hint = t('pickerHint', { library: this.library.size, probes: this.library.probeCount });
            this.$hint.toggleClass('om-spin', this.inflight.size > 0).text(addedFrom.length ? `${hint} · ${t('pickerHintAdded', { probes: addedFrom.join(', ') })}` : hint);
        }

        static markup(title) {
            return `
                <div class="om-ui om-modal">
                    <div class="om-dlg">
                        <div class="om-h">
                            <div class="om-h-t">${escapeHtml(title)}</div>
                            <input class="om-q" spellcheck="false" placeholder="${escapeHtml(t('searchPlaceholder'))}">
                            <button type="button" class="om-b om-none" title="${escapeHtml(t('noChannelHint'))}">${escapeHtml(t('noChannelButton'))}</button>
                            <button type="button" class="om-b om-close" title="${escapeHtml(t('close'))}">&#10005;</button>
                        </div>
                        <div class="om-hint"></div>
                        <div class="om-current"></div>
                        <div class="om-list"></div>
                    </div>
                </div>`;
        }
    }

    class DissolveDialog {
        constructor(onStop) {
            this.onStop = onStop;
            this.$root = null;
            this.$target = null;
            this.$go = null;
            this.$cancel = null;
            this.modal = null;
            this.opening = null;
            this.running = false;
            this.from = null;
            this.targets = [];
            this.count = 0;
            this.settle = () => null;
        }

        static uikitAvailable() {
            const uikit = pageWindow.UIkit;
            return Boolean(uikit && uikit.modal);
        }

        /** resolves with the chosen group, or with null once the dialog closes without one */
        ask(from, targets, count) {
            this.close();
            Object.assign(this, { from, targets, count, running: false });
            this.$root = $(DissolveDialog.markup()).appendTo('body');
            this.$root.find('.uk-modal-title').text(t('dissolveTitle', { group: from.title }));
            this.$target = this.$root.find('.om-target')
                .append($('<option value="">').text(t('moveTo')), targets.map(group => $('<option>').val(group.id).text(group.title)))
                .on('change', () => this.showCount());
            this.$go = this.$root.find('.om-go').on('click', () => this.settle(this.chosenTarget()));
            this.$cancel = this.$root.find('.om-cancel').on('click', () => this.cancelOrStop());
            this.showCount();
            const answer = new Promise(resolve => {
                this.settle = resolve;
            });
            this.show();
            return answer;
        }

        chosenTarget() {
            return this.targets.find(group => group.id === this.$target.val()) || null;
        }

        showCount() {
            const to = this.chosenTarget();
            const params = { count: this.count, from: this.from.title, to: to && to.title };
            this.$root.find('.om-count').text(t(to ? 'dissolveCount' : 'dissolveChoose', params));
            this.$go.prop('disabled', !to).text(t('dissolveConfirm', params));
        }

        showProgress(done, total) {
            if (!this.$root) return;
            this.running = true;
            this.$target.prop('disabled', true);
            this.$go.prop('hidden', true);
            this.$cancel.text(t('stop'));
            this.$root.find('progress').prop('hidden', false).attr({ value: done, max: total });
            this.$root.find('.om-count').addClass('om-spin').text(`${done} / ${total}`);
        }

        cancelOrStop() {
            if (this.running) {
                this.onStop();
            } else {
                this.close();
            }
        }

        /** uikit3.min.css keeps a .uk-modal and its dialog invisible until .uk-open; a UIkit modal closes on Esc and outside clicks unless told not to */
        show() {
            if (!DissolveDialog.uikitAvailable()) {
                this.$root.addClass('om-modal uk-open').children().addClass('om-dlg om-small');
                return;
            }
            const $root = this.$root;
            $root.on('hidden', event => event.target === event.currentTarget && this.discard($root));
            this.modal = pageWindow.UIkit.modal($root[0], { escClose: false, bgClose: false });
            this.opening = this.modal.show();
        }

        /** UIkit opens a modal in the next animation frame, and a hide() before that frame does nothing */
        close() {
            this.settle(null);
            if (this.modal) {
                const modal = this.modal;
                this.opening.catch(() => null).then(() => modal.hide());
            } else if (this.$root) {
                this.discard(this.$root);
            }
        }

        /** a UIkit modal is removed only once hidden, or the page keeps its scroll lock */
        discard($root) {
            $root.remove();
            if (this.$root !== $root) return;
            this.settle(null);
            Object.assign(this, { $root: null, modal: null, opening: null, running: false });
        }

        static markup() {
            return `
                <div class="om-ui uk-modal om-dissolve">
                    <div class="uk-modal-dialog uk-modal-body">
                        <h2 class="uk-modal-title"></h2>
                        <label>${escapeHtml(t('dissolveTarget'))}
                            <select class="uk-select om-target"></select>
                        </label>
                        <p class="om-count"></p>
                        <progress class="uk-progress" value="0" max="1" hidden></progress>
                        <p class="uk-text-right">
                            <button type="button" class="uk-button uk-button-default om-cancel">${escapeHtml(t('cancel'))}</button>
                            <button type="button" class="uk-button uk-button-primary om-go"></button>
                        </p>
                    </div>
                </div>`;
        }
    }

    class Reconciler {
        constructor({ page, decisions, editor, batch, view, panel }) {
            this.page = page;
            this.decisions = decisions;
            this.editor = editor;
            this.batch = batch;
            this.view = view;
            this.panel = panel;
        }

        makeChannelMatch(channel, patch) {
            return this.alignChannel(channel, patch, current => this.decisions.remember(current, patch));
        }

        replayDecision(channel, decision) {
            return this.alignChannel(channel, this.withoutLeavingFavourite(channel, decision), current => this.decisions.fileUnderCode(current, decision));
        }

        /** a page-open lock comes before anyone chose a profile, so it writes and remembers nothing */
        enforce(channel, patch) {
            return this.alignChannel(channel, patch, () => null);
        }

        /** a remembered group never takes a row out of the favourite group: a copy whose original was deleted has no namesake left to show it is one */
        withoutLeavingFavourite(channel, decision) {
            const staysInFavourite = decision.group && this.page.isInGroup(channel.uuid, this.decisions.favouriteGroupId());
            return staysInFavourite ? Object.assign({}, decision, { group: '' }) : decision;
        }

        /** the site binds a new channel by its title and never updates a copy's address: a copy is set to its original's, none included */
        mirrorOnto(copy, form) {
            const wanted = { href: form.href, libchannel_id: form.libchannel_id || '', adult: Decisions.adultValue(form.adult === '1') };
            return this.writeAndShow(copy, wanted, {}, () => null);
        }

        /** the decision is filed after the attempt, when reading the form may have taught the channel's code */
        alignChannel(snapshot, decision, fileDecision) {
            const channel = this.page.currentStateOf(snapshot);
            return this.writeAndShow(channel, this.changesTo(decision, channel, this.page.groupsByTitle()), decision, fileDecision);
        }

        changesTo(decision, channel, groupsByTitle) {
            const wanted = Decisions.changesTo(decision, channel, groupsByTitle);
            if (wanted.group_id && this.movesAcrossFavourite(channel, wanted.group_id)) delete wanted.group_id;
            return wanted;
        }

        /** a copy has its original's title and address, and so its original's remembered group: moves leave the favourite group alone */
        movesAcrossFavourite(channel, groupId) {
            const favouriteId = this.decisions.favouriteGroupId();
            const inFavourite = this.page.isInGroup(channel.uuid, favouriteId);
            if (!favouriteId || (!inFavourite && groupId !== favouriteId)) return false;
            const index = FavouriteCopies.indexOf(this.page.rowTitles(), favouriteId);
            const byTitle = inFavourite ? index.outsideByTitle : index.insideByTitle;
            return FavouriteCopies.idsOf(byTitle, channel).length > 0;
        }

        async writeAndShow(channel, wanted, decision, fileDecision) {
            try {
                return await this.view.whileWorking(this.page.rowById(channel.uuid), this.writeDifferences(channel, wanted, decision));
            } finally {
                fileDecision(channel);
                this.view.redrawRow(this.page.rowById(channel.uuid));
            }
        }

        async writeDifferences(channel, wanted, decision) {
            if (!size(wanted)) return Step.SKIPPED;
            const written = await this.editor.write(channel, wanted);
            this.view.showSaved(channel, wanted, written);
            if (!written.length) return Step.UNCHANGED;
            this.panel.log(`✓ ${channel.title}${Reconciler.describeChanges(written, wanted, decision)}`, 'ok');
            return Step.CHANGED;
        }

        static describeChanges(written, wanted, decision) {
            return written.map(field => {
                if (field === 'libchannel_id') return ` → ${[wanted.libchannel_id || '—', decision.name].filter(Boolean).join(' ')}`;
                if (field === 'adult') return wanted.adult === '1' ? ' → 18+' : ` → ${t('changeUnlocked')}`;
                if (field === 'href') return ` → ${t('addressUpdated')}`;
                if (field === 'group_id') return ` → «${decision.group}»`;
                return ` → ${field}`;
            }).join('');
        }

        async apply(openGroupOnly) {
            const started = this.batch.generation;
            const channels = this.page.channels(openGroupOnly ? this.page.openGroupRows() : this.page.allRows());
            if (!channels.length) {
                this.panel.log(t('noChannelsVisible'), 'warn');
                return;
            }
            await this.resolveNamesakes(channels);
            if (this.batch.stoppedAndReportedSince(started)) return;
            const groupsByTitle = this.page.groupsByTitle();
            const plans = channels.map(channel => this.planFor(channel, groupsByTitle)).filter(Boolean);
            const scope = t(openGroupOnly ? 'scopeGroup' : 'scopePlaylist');
            if (!plans.length) {
                this.reportNothingToApply(channels, scope);
                return;
            }
            const askFirst = !openGroupOnly;
            if (askFirst && !Reconciler.confirmApply(plans, scope)) return;
            await this.batch.run(t('labelApply'), plans, plan => this.replayDecision(plan.channel, plan.decision));
        }

        planFor(channel, groupsByTitle) {
            const decision = this.decisions.decisionFor(channel);
            const wanted = decision ? this.changesTo(this.withoutLeavingFavourite(channel, decision), channel, groupsByTitle) : {};
            return size(wanted) ? { channel, decision, wanted } : null;
        }

        reportNothingToApply(channels, scope) {
            const known = channels.filter(channel => this.decisions.decisionFor(channel)).length;
            if (known) {
                this.panel.log(t('allAsRemembered', { known, total: channels.length, scope }));
                return;
            }
            this.panel.log(t('noTitleInProfile', { total: channels.length, scope, profile: this.decisions.profile.name }), 'warn');
            this.hintOtherProfiles();
        }

        static confirmApply(plans, scope) {
            const groupChecks = plans.filter(plan => size(plan.wanted) === 1 && plan.wanted.group_id).length;
            const question = t('confirmApply', { count: plans.length, scope });
            return confirm(groupChecks ? `${question}\n\n${t('confirmApplyGroupChecks', { count: groupChecks })}` : question);
        }

        hintOtherProfiles() {
            const others = this.decisions.otherProfilesWithDecisions().slice(0, 3);
            if (others.length) {
                this.panel.log(t('decisionsElsewhere', { profiles: others.map(profile => `${profile.name} (${profile.byTitle})`).join(', ') }), 'warn');
            }
        }

        async resolveNamesakes(channels) {
            const namesakes = channels.filter(channel => !this.decisions.codeOf(channel) && this.decisions.isSharedTitle(channel.title));
            if (!namesakes.length) return;
            this.panel.log(t('readingNamesakes', { count: namesakes.length }));
            await this.batch.run('ch', namesakes, async channel => {
                await this.editor.readFormAndLearnRow(channel);
                return Step.UNCHANGED;
            }, { summary: false, readOnly: true });
        }

        async synchronize(playlistWins) {
            const started = this.batch.generation;
            await this.loadSource();
            if (this.batch.stoppedAndReportedSince(started)) return;
            const channels = this.page.channels(this.page.allRows());
            if (!channels.length) {
                this.panel.log(t('noChannelsVisible'), 'warn');
                return;
            }
            await this.resolveNamesakes(channels);
            if (this.batch.stoppedAndReportedSince(started)) return;
            const filed = this.decisions.fileTitleDecisionsUnderCodes(Reconciler.displayTitles(channels));
            const outcomes = channels.map(channel => this.recordObservedState(channel, playlistWins));
            const clashes = outcomes.map(outcome => outcome.clash).filter(Boolean);
            this.panel.log(t('syncDone', {
                recorded: outcomes.filter(outcome => outcome.recorded).length,
                same: outcomes.filter(outcome => outcome.same).length,
                filed,
                clashes: clashes.length,
            }));
            if (clashes.length) this.panel.log(t('syncClashHint'), 'warn');
            clashes.slice(0, 5).forEach(clash => this.panel.log(clash, 'warn'));
            this.view.redecorateAll();
        }

        async loadSource() {
            const url = PlaylistPage.updateUrl();
            if (!url) {
                this.panel.log(t('sourceFailed', { error: t('errorNoUpdateUrl') }), 'warn');
                return;
            }
            this.panel.status(t('loadingSource'));
            try {
                this.panel.log(t('sourceLoaded', this.decisions.learnSource(await SourcePlaylist.load(url))));
            } catch (error) {
                this.panel.log(t('sourceFailed', { error: describeError(error) }), 'warn');
            } finally {
                this.panel.status('');
            }
        }

        static displayTitles(channels) {
            return dictionary(Object.fromEntries(channels.map(channel => [ChannelTitle.key(channel.title), channel.title])));
        }

        recordObservedState(channel, playlistWins) {
            const decision = this.decisions.decisionFor(channel) || {};
            const observed = Reconciler.observedState(channel, decision);
            if (!size(observed)) return {};
            const { fill, differ } = Reconciler.reconcile(decision, observed, playlistWins);
            if (size(fill)) this.decisions.remember(channel, fill);
            return {
                recorded: size(fill) > 0,
                same: !size(fill) && !differ.length,
                clash: differ.length ? Reconciler.describeClash(channel, decision, observed, differ) : null,
            };
        }

        /** an unlocked channel counts only where memory says otherwise: a sync must not spread "not 18+" over the provider */
        static observedState(channel, decision) {
            const observed = {};
            if (channel.libId) observed.epg_id = channel.libId;
            if (channel.adult) {
                observed.adult = '1';
            } else if (decision.adult !== undefined) {
                observed.adult = '0';
            }
            return observed;
        }

        static reconcile(decision, observed, playlistWins) {
            const fill = {};
            const differ = [];
            for (const [field, value] of Object.entries(observed)) {
                if (decision[field] === value) continue;
                if (decision[field] === undefined || playlistWins) {
                    fill[field] = value;
                } else {
                    differ.push(field);
                }
            }
            return { fill, differ };
        }

        static describeClash(channel, decision, observed, fields) {
            const details = fields.map(field => t('syncClashField', { field, remembered: decision[field], actual: observed[field] }));
            return `${channel.title}: ${details.join('; ')}`;
        }
    }

    class Favourites {
        constructor({ site, page, decisions, editor, batch, view, panel, reconciler, playlistId }) {
            this.site = site;
            this.page = page;
            this.decisions = decisions;
            this.editor = editor;
            this.batch = batch;
            this.view = view;
            this.panel = panel;
            this.reconciler = reconciler;
            this.playlistId = playlistId;
        }

        setGroup(group) {
            if (!this.mayLeaveTheCopies()) return;
            this.decisions.setFavouriteGroup(group.id);
            this.view.redecorateAll();
            this.panel.logAndToast(t('favouriteSet', { group: group.title }), 'ok');
        }

        clearGroup() {
            if (!this.mayLeaveTheCopies()) return;
            this.decisions.clearFavouriteGroup();
            this.view.redecorateAll();
            this.panel.logAndToast(t('favouriteCleared'), 'ok');
        }

        /** a copy is told from its original only while its group is the favourite one */
        mayLeaveTheCopies() {
            const favourite = this.view.favouriteGroup();
            if (!favourite) return true;
            const index = this.indexOf(favourite);
            const copies = this.page.channels(this.page.groupRows(favourite.id))
                .filter(member => FavouriteCopies.idsOf(index.outsideByTitle, member).length > 0).length;
            return !copies || confirm(t('confirmLeaveFavourite', { group: favourite.title, count: copies }));
        }

        indexOf(favourite) {
            return FavouriteCopies.indexOf(this.page.rowTitles(), favourite.id);
        }

        async toggleStar($row) {
            const favourite = this.view.favouriteGroup();
            if (!favourite) return;
            const started = this.batch.generation;
            await this.batch.run(t('labelFavourite'), [this.page.channel($row)], channel => this.toggleStarOf(channel, favourite, started));
            this.view.redecorateAll();
        }

        toggleStarOf(snapshot, favourite, started) {
            const channel = this.page.currentStateOf(snapshot);
            const index = this.indexOf(favourite);
            const star = FavouriteCopies.starOf(channel, index);
            if (star === Star.OFF) return this.addCopy(channel, favourite, started);
            if (star === Star.ON) return this.removeCopy(channel, favourite, index);
            this.panel.log(t(FavouriteCopies.hintOf(star), { title: channel.title, group: favourite.title }), 'warn');
            return Step.SKIPPED;
        }

        /** the site, not the page, tells whether the favourite group holds the title already; making the copy and binding it are then one step */
        async addCopy(channel, favourite, started) {
            const form = await this.editor.readFormAndLearnRow(channel);
            const current = await this.site.fetchPage(location.href);
            if (this.batch.stoppedAndReportedSince(started)) return Step.SKIPPED;
            const members = this.page.channels(PlaylistPage.groupRowsIn(current, favourite.id));
            if (members.some(member => member.title === channel.title)) return this.showCopyAlreadyThere(channel, favourite, current);
            await this.site.createChannel({ playlistId: this.playlistId, groupId: favourite.id, name: form.ch_title || channel.title, href: form.href });
            try {
                const copy = this.newCopyOf(channel, favourite, new Set(members.map(member => member.uuid)), await this.site.fetchPage(location.href));
                this.panel.log(`★ ${channel.title} → «${favourite.title}»`, 'ok');
                await this.reconciler.mirrorOnto(copy, form);
                return Step.CHANGED;
            } catch (unfinished) {
                this.panel.log(t('copyUnfinished', { title: channel.title, group: favourite.title }), 'warn');
                throw unfinished;
            } finally {
                await this.showGroupFromSite(favourite);
            }
        }

        showCopyAlreadyThere(channel, favourite, doc) {
            this.showGroupFrom(doc, favourite);
            this.panel.log(t('copyAlreadyThere', { title: channel.title, group: favourite.title }), 'warn');
            return Step.SKIPPED;
        }

        /** a failed read leaves the page as it was, and the next star reads the site first */
        async showGroupFromSite(group) {
            try {
                this.showGroupFrom(await this.site.fetchPage(location.href), group);
            } catch (error) {
                this.panel.logFailure(t('refreshFailed', { error: describeError(error) }), error);
            }
        }

        /** the site answers a new channel with a redirect and no id: the copy is the one new row of that title in the fetched page */
        newCopyOf(channel, favourite, idsBefore, doc) {
            const created = this.page.channels(PlaylistPage.groupRowsIn(doc, favourite.id))
                .filter(candidate => !idsBefore.has(candidate.uuid) && candidate.title === channel.title);
            if (created.length !== 1) {
                throw Object.assign(new Error(t('copyUnclear', { group: favourite.title, count: created.length })), { channelTitle: channel.title });
            }
            const { uuid, title, url } = created[0];
            return { uuid, title, url };
        }

        showGroupFrom(doc, group) {
            PlaylistPage.updateGroupRowsFrom(doc, group.id);
            this.view.showKnownNoChannelRows();
        }

        async removeCopy(channel, favourite, index) {
            const copy = this.page.channel(this.page.rowById(FavouriteCopies.copyIdOf(channel, index)));
            const original = this.page.channel(this.page.rowById(FavouriteCopies.originalIdOf(channel, index)));
            if (!await this.isSameStream(copy, await this.editor.readFormAndLearnRow(original))) return this.leaveOtherStream(copy, favourite);
            await this.site.deleteChannel(copy.uuid, this.playlistId);
            PlaylistPage.removeRow(this.page.rowById(copy.uuid));
            this.panel.log(`☆ ${channel.title} ✕ «${favourite.title}»`, 'ok');
            return Step.CHANGED;
        }

        /** the ch code of a stream address outlives a new token: two rows of one title with different codes are two channels */
        async isSameStream(copy, originalForm) {
            const originalCode = SourcePlaylist.channelCode(originalForm.href);
            const copyCode = SourcePlaylist.channelCode((await this.editor.readFormAndLearnRow(copy)).href);
            return !originalCode || !copyCode || originalCode === copyCode;
        }

        leaveOtherStream(copy, favourite) {
            this.panel.log(t('otherStream', { title: copy.title, group: favourite.title }), 'warn');
            return Step.SKIPPED;
        }

        /** a playlist update keeps a copy while its title is in the source, and never changes its address */
        async updateCopies(favourite) {
            if (!this.decisions.isFavouriteGroup(favourite.id)) return;
            const index = this.indexOf(favourite);
            const members = this.page.channels(this.page.groupRows(favourite.id));
            const copies = members.filter(member => FavouriteCopies.starOf(member, index) === Star.ON);
            const left = members.filter(member => !copies.includes(member));
            if (copies.length && !confirm(t('confirmUpdateCopies', { group: favourite.title, count: copies.length }))) return;
            if (left.length) this.panel.log(t('copiesLeft', { group: favourite.title, titles: left.map(member => `«${member.title}»`).join(', ') }), 'warn');
            const tally = await this.batch.run(t('labelCopies'), copies, copy => this.updateCopy(copy, favourite), { summary: false });
            this.view.redecorateAll();
            const counts = { group: favourite.title, updated: tally[Step.CHANGED], count: copies.length, left: left.length };
            this.panel.logAndToast(t('copiesChecked', counts), left.length ? 'warn' : 'ok');
        }

        async updateCopy(snapshot, favourite) {
            const copy = this.page.currentStateOf(snapshot);
            const originalId = FavouriteCopies.originalIdOf(copy, this.indexOf(favourite));
            if (!originalId) return Step.SKIPPED;
            const form = await this.editor.readFormAndLearnRow(this.page.channel(this.page.rowById(originalId)));
            if (!await this.isSameStream(copy, form)) return this.leaveOtherStream(copy, favourite);
            return this.reconciler.mirrorOnto(copy, form);
        }
    }

    class Transfer {
        constructor({ store, decisions, library, view, panel }) {
            this.store = store;
            this.decisions = decisions;
            this.library = library;
            this.view = view;
            this.panel = panel;
        }

        exportAll() {
            const profile = this.decisions.profile.name;
            saveJsonFile(`ottplayer-mapping-${profile}.json`, this.store.fullExport(profile));
            this.panel.log(t('exported'));
        }

        exportCodes() {
            saveJsonFile(`ottplayer-ch-${this.decisions.profile.name}.json`, this.decisions.codeMapExport());
            this.panel.log(t('exportedCodes', { count: size(this.decisions.byCode()) }));
        }

        exportLibrary() {
            saveJsonFile('ottplayer-library.json', this.library.exportData());
            this.panel.log(t('exportedLibrary', { size: this.library.size, probes: this.library.probeCount }));
        }

        chooseFile() {
            $('<input type="file" accept=".json,.m3u,.m3u8,application/json">')
                .on('change', event => this.importFile(($(event.target).prop('files') || [])[0]))
                .trigger('click');
        }

        async importFile(file) {
            if (!file) return;
            try {
                const text = await file.text();
                if (Transfer.isPlaylist(text)) {
                    this.panel.log(t('importedPlaylist', this.decisions.learnSource(SourcePlaylist.parse(text))));
                } else {
                    this.panel.log(t('imported', this.importBackup(parseJson(text))));
                }
                this.store.save();
                this.view.redecorateAll();
            } catch (error) {
                this.panel.log(t('importFailed', { error: describeError(error) }), 'err');
            }
        }

        importBackup(backup) {
            return Object.assign(this.library.importLibrary(backup), this.decisions.importDecisions(backup));
        }

        static isPlaylist(text) {
            return /^﻿?#EXTM3U|#EXTINF/.test(text);
        }
    }

    class Diagnostics {
        constructor({ page, decisions, editor, site, panel, window }) {
            this.page = page;
            this.decisions = decisions;
            this.editor = editor;
            this.site = site;
            this.panel = panel;
            this.window = window;
        }

        async run() {
            const channels = this.page.channels(this.page.allRows());
            const $open = this.page.openGroupRows();
            const group = this.page.activeGroup();
            const { name, reason } = this.decisions.profile;
            this.panel.log(t('diagTitle'));
            this.panel.log(t('diagCounts', { all: channels.length, open: $open.length, groups: this.page.groups().length, group: group ? group.title : '—' }));
            this.panel.log(t('diagProfile', { profile: name, reason: t(reason), byTitle: size(this.decisions.byTitle()), byCode: size(this.decisions.byCode()) }));
            this.panel.log(t('diagCodes', {
                withCode: channels.filter(channel => this.decisions.codeOf(channel)).length,
                all: channels.length,
                titles: size(this.decisions.titleCodes()),
                shared: this.decisions.sharedTitleCount(),
                updateUrl: Boolean(PlaylistPage.updateUrl()),
            }));
            await this.showFirstChannel($open.length ? $open.first() : this.page.allRows().first());
            await this.showLibrarySearch();
            await this.showGroupHandlers();
        }

        async showFirstChannel($row) {
            if (!$row.length) return;
            const channel = this.page.channel($row);
            const summary = { title: channel.title, ch: this.decisions.codeOf(channel), libId: channel.libId, adult: channel.adult };
            this.panel.log(t('diagFirstChannel', { channel: JSON.stringify(summary) }), 'code');
            this.panel.log(t('diagEditUrl', { url: channel.url }), 'code');
            try {
                const form = await this.editor.readForm(channel);
                this.panel.log(t('diagForm', { fields: maskTokens(JSON.stringify(form)) }), 'code');
            } catch (error) {
                this.panel.logFailure(t('diagFormFailed', { error: describeError(error) }), error);
            }
        }

        async showLibrarySearch() {
            try {
                const found = await this.site.searchLibrary('bc');
                this.panel.log(`libch_srch("bc") → ${size(found)}: ${JSON.stringify(Object.entries(found).slice(0, 5))}`, 'code');
            } catch (error) {
                this.panel.logFailure(`libch_srch: ${describeError(error)}`, error);
            }
        }

        async showGroupHandlers() {
            this.panel.log(t('diagGroupHandlers'));
            const snippets = await this.snippetsAround(/delete_group|hide_group|delete_ch\b/);
            if (!snippets.length) this.panel.log(t('diagGroupHandlersNone'), 'warn');
            snippets.forEach(snippet => this.panel.log(snippet, 'code'));
        }

        async snippetsAround(pattern, limit = 8) {
            const snippets = [];
            for (const source of await this.pageScripts()) {
                for (const match of source.matchAll(new RegExp(pattern.source, 'g'))) {
                    if (snippets.length >= limit) return snippets;
                    snippets.push(source.slice(Math.max(0, match.index - 150), match.index + 250).replace(/\s+/g, ' '));
                }
            }
            return snippets;
        }

        async pageScripts() {
            const inline = $('script:not([src])').map((index, script) => $(script).text()).get();
            const external = await Promise.all($('script[src]').map((index, script) => $(script).prop('src')).get()
                .filter(src => src.startsWith(`${ORIGIN}/`))
                .map(src => this.window.fetch(src, { credentials: 'same-origin' })
                    .then(response => response.text())
                    .catch(() => '')));
            return inline.concat(external).filter(source => !source.includes('id="om-panel"'));
        }
    }

    class PlaylistOrganizer {
        constructor() {
            this.panel = new Panel();
            this.store = new Store(pageWindow.localStorage, STORAGE_KEY, () => this.panel.log(t('storageFull'), 'err'));
            this.site = new OttPlayerSite(pageWindow);
            this.decisions = new Decisions(this.store, PLAYLIST_ID, PlaylistPage.updateUrl());
            this.page = new PlaylistPage(PLAYLIST_ID);
            this.library = new LibraryIndex(this.store, this.site);
            this.editor = new ChannelEditor(this.site, this.decisions, PLAYLIST_ID, (text, kind) => this.panel.log(text, kind));
            this.batch = new BatchRunner(this.panel);
            this.view = new PlaylistView(this.page, this.decisions, this.library, this.panel, new GroupMenu());
            this.picker = new LibraryPicker(this.library,
                this.userAction(($row, id, name) => this.view.whileWorking($row, this.bindRow($row, id, name))));
            this.dissolveDialog = new DissolveDialog(() => this.batch.stop());
            const parts = { page: this.page, decisions: this.decisions, editor: this.editor, batch: this.batch, view: this.view, panel: this.panel };
            this.reconciler = new Reconciler(parts);
            this.favourites = new Favourites(Object.assign({ site: this.site, reconciler: this.reconciler, playlistId: PLAYLIST_ID }, parts));
            this.transfer = new Transfer(Object.assign({ store: this.store, library: this.library }, parts));
            this.diagnostics = new Diagnostics(Object.assign({ site: this.site, window: pageWindow }, parts));
            this.init();
        }

        init() {
            this.panel.mount({
                actions: this.panelActions(),
                takeover: this.takeoverEnabled(),
                onProfileChange: name => this.chooseProfile(name),
                onTakeoverChange: enabled => this.setTakeover(enabled),
            });
            this.view.mount({
                pick: $row => this.picker.open(this.page.channel($row)),
                setNoChannel: this.userAction($row => this.bindRow($row, NO_CHANNEL, t('noChannelName'))),
                toggleAdult: this.userAction($row => this.toggleAdult($row)),
                moveTo: this.userAction(($row, group) => this.moveToGroup($row, group)),
                lockGroup: this.userAction(group => this.setGroupAdult(group, true)),
                unlockGroup: this.userAction(group => this.setGroupAdult(group, false)),
                noChannel: this.userAction(group => this.setGroupNoChannel(group)),
                dissolveGroup: this.userAction(group => this.dissolveGroup(group)),
                setFavourite: this.userAction(group => this.favourites.setGroup(group)),
                clearFavourite: this.userAction(() => this.favourites.clearGroup()),
                updateCopies: this.userAction(group => this.favourites.updateCopies(group)),
                toggleStar: this.userAction($row => this.favourites.toggleStar($row)),
            });
            this.interceptChannelDeleteBeforeUikit();
            this.mergeWhenAnotherTabSaves();
            this.greet();
            this.userAction(() => this.lockAdultGroups())();
        }

        panelActions() {
            return [
                [
                    { action: 'apply', hint: 'applyHint', style: 'pri', run: this.userAction(event => this.reconciler.apply(event.shiftKey)) },
                    { action: 'sync', hint: 'syncHint', run: this.userAction(event => this.reconciler.synchronize(event.shiftKey)) },
                    { action: 'buildLibrary', hint: 'buildLibraryHint', run: this.userAction(event => this.collectLibrary(event.shiftKey)) },
                ],
                [
                    { action: 'exportAll', run: () => this.transfer.exportAll() },
                    { action: 'exportCodes', hint: 'exportCodesHint', run: () => this.transfer.exportCodes() },
                    { action: 'exportLibrary', run: () => this.transfer.exportLibrary() },
                    { action: 'import', hint: 'importHint', run: () => this.transfer.chooseFile() },
                ],
                [
                    { action: 'refresh', run: this.userAction(() => this.reloadLists()) },
                    { action: 'diagnose', run: () => this.diagnostics.run() },
                    { action: 'stop', style: 'dng', run: () => this.batch.stop() },
                ],
            ];
        }

        /** every user action ends saved, with the header recounted */
        userAction(handler) {
            return async (...args) => {
                try {
                    await handler(...args);
                } finally {
                    this.store.save();
                    this.view.updateHeader();
                }
            };
        }

        greet() {
            const { name, reason } = this.decisions.profile;
            const decisions = size(this.decisions.byTitle());
            this.panel.log(t('ready', { profile: name, reason: t(reason), decisions }));
            if (!decisions) this.reconciler.hintOtherProfiles();
            this.reportMissingPageWidgets();
        }

        reportMissingPageWidgets() {
            if (!GroupMenu.widgetAvailable()) this.panel.log(t('jqueryUiMissing'), 'warn');
            if (!DissolveDialog.uikitAvailable()) this.panel.log(t('uikitMissing'), 'warn');
        }

        toggleAdult($row) {
            const channel = this.page.channel($row);
            return this.setAdult([channel], !channel.adult);
        }

        setAdult(channels, adult) {
            const decision = { adult: Decisions.adultValue(adult) };
            return this.batch.run('18+', channels, channel => this.reconciler.makeChannelMatch(channel, decision));
        }

        async setGroupAdult(group, lock) {
            if (!confirm(t(lock ? 'confirmLockGroup' : 'confirmUnlockGroup', { group: group.title }))) return;
            const channels = await this.channelsOfGroup(group);
            if (channels) await this.setAdult(channels, lock);
        }

        /** a playlist update recreates a channel renamed at its source without 18+, and only its result shows here */
        async lockAdultGroups() {
            const unlocked = this.page.groups()
                .filter(group => ADULT_GROUP.test(group.title))
                .flatMap(group => this.page.channels(this.page.groupRows(group.id)))
                .filter(channel => !channel.adult && (this.decisions.decisionFor(channel) || {}).adult !== Decisions.adultValue(false));
            if (!unlocked.length) return;
            const decision = { adult: Decisions.adultValue(true) };
            const tally = await this.batch.run('18+', unlocked, channel => this.reconciler.enforce(channel, decision), { summary: false });
            if (tally[Step.CHANGED]) this.panel.logAndToast(t('adultGroupsLocked', { count: tally[Step.CHANGED] }), 'ok');
        }

        async setGroupNoChannel(group) {
            const channels = await this.channelsOfGroup(group);
            if (!channels) return;
            const unbound = channels.filter(channel => !channel.libId && !(this.decisions.decisionFor(channel) || {}).epg_id);
            if (!unbound.length) {
                this.panel.log(t('noUnboundInGroup', { group: group.title }));
                return;
            }
            if (!confirm(t('confirmNoChannel', { group: group.title, count: unbound.length }))) return;
            const decision = { epg_id: NO_CHANNEL, name: t('noChannelName') };
            await this.batch.run(t('noChannelName'), unbound, channel => this.reconciler.makeChannelMatch(channel, decision));
        }

        async channelsOfGroup(group) {
            const started = this.batch.generation;
            this.panel.status(t('openingGroup', { group: group.title }));
            const opened = await this.page.openGroup(group, () => this.batch.stoppedSince(started));
            this.panel.status('');
            if (opened) return this.page.channels(this.page.openGroupRows());
            if (!this.batch.stoppedAndReportedSince(started)) this.panel.log(t('groupNotOpened', { group: group.title }), 'err');
            return null;
        }

        async dissolveGroup(group) {
            if (this.decisions.isFavouriteGroup(group.id)) return;
            const channels = await this.channelsOfGroup(group);
            if (!channels) return;
            if (!channels.length) {
                this.panel.log(t('groupEmpty', { group: group.title }), 'warn');
                return;
            }
            const targets = this.page.groups().filter(other => other.id !== group.id);
            const target = await this.dissolveDialog.ask(group, targets, channels.length);
            if (!target) return;
            try {
                const moved = await this.moveAll(channels, target);
                this.panel.logAndToast(t('dissolveDone', { from: group.title, to: target.title, moved, total: channels.length }), 'ok');
            } finally {
                this.dissolveDialog.close();
            }
        }

        async moveAll(channels, target) {
            let done = 0;
            this.dissolveDialog.showProgress(done, channels.length);
            const tally = await this.batch.run(t('labelDissolve'), channels, async channel => {
                try {
                    return await this.moveChannel(channel, target);
                } finally {
                    this.dissolveDialog.showProgress(++done, channels.length);
                }
            }, { summary: false });
            return tally[Step.CHANGED];
        }

        moveChannel(channel, target) {
            if (this.reconciler.movesAcrossFavourite(channel, target.id)) {
                this.panel.log(t('copyNotMoved', { title: channel.title }), 'warn');
                return Step.SKIPPED;
            }
            return this.reconciler.makeChannelMatch(channel, { group: target.title });
        }

        bindRow($row, id, name) {
            const decision = { epg_id: id, name: name || '' };
            return this.batch.run(t('labelBinding'), [this.page.channel($row)], channel => this.reconciler.makeChannelMatch(channel, decision));
        }

        moveToGroup($row, group) {
            return this.batch.run(t('labelMove'), [this.page.channel($row)], channel => this.moveChannel(channel, group));
        }

        async collectLibrary(everyLetterPair) {
            const candidates = everyLetterPair ? LibraryIndex.allLetterPairs() : this.probesOfPlaylist();
            if (!candidates.length) {
                this.panel.log(t('noChannelsVisible'), 'warn');
                return;
            }
            const probes = this.library.unprobed(candidates).sort();
            if (!probes.length) {
                this.panel.log(t('libraryComplete', { size: this.library.size }));
                return;
            }
            const sizeBefore = this.library.size;
            this.panel.log(t('libraryProbes', { count: probes.length }));
            await this.batch.run(t('labelSearch'), probes, async probe => {
                const added = await this.library.probe(probe);
                this.store.saveSoon();
                return added ? Step.CHANGED : Step.UNCHANGED;
            }, { readOnly: true });
            this.panel.log(t('libraryDone', { size: this.library.size, added: this.library.size - sizeBefore }));
        }

        probesOfPlaylist() {
            return [...new Set(this.page.channels(this.page.allRows()).flatMap(channel => LibraryIndex.probesFor(channel.title)))];
        }

        /** the trash link is a UIkit toggle bound on the element itself, so only a capture listener gets there first */
        interceptChannelDeleteBeforeUikit() {
            document.addEventListener('click', event => {
                const $link = $(event.target).closest(PlaylistPage.DELETE_LINK);
                if (!$link.length || !this.takesOverDelete($link)) return;
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                this.deleteChannel($link);
            }, true);
        }

        /** @see https://ottplayer.tv/public/js/main.js .delete_ch fills the confirm link once per row at load: a row inserted later is deleted by the tool */
        takesOverDelete($link) {
            return this.takeoverEnabled() || PlaylistPage.isInsertedRow(this.page.rowOf($link));
        }

        async deleteChannel($link) {
            const target = this.page.deleteTargetOf($link);
            if (!confirm(t('confirmDelete', { name: target.name }))) return;
            try {
                await this.site.deleteChannel(target.channelId, target.playlistId);
                PlaylistPage.removeRow(this.page.rowOf($link));
                this.panel.log(t('deleted', { name: target.name }), 'ok');
                this.view.redecorateAll();
            } catch (error) {
                this.panel.logFailure(t('deleteFailed', { error: describeError(error) }), error);
            }
        }

        async reloadLists() {
            this.panel.status(t('refreshing'));
            try {
                PlaylistPage.replaceListsFrom(await this.site.fetchPage(location.href));
                this.view.showKnownNoChannelRows();
                this.view.redecorateAll();
                this.panel.log(t('refreshed'));
            } catch (error) {
                this.panel.logFailure(t('refreshFailed', { error: describeError(error) }), error);
                return;
            } finally {
                this.panel.status('');
            }
            await this.lockAdultGroups();
        }

        chooseProfile(name) {
            this.decisions.switchTo(name, 'reasonManual');
            const channels = this.page.channels(this.page.allRows());
            const known = channels.filter(channel => this.decisions.decisionFor(channel)).length;
            this.panel.log(t('profileChosen', { profile: name, decisions: size(this.decisions.byTitle()), known, total: channels.length }));
            this.view.redecorateAll();
        }

        takeoverEnabled() {
            return this.store.data.settings.takeover !== false;
        }

        setTakeover(enabled) {
            this.store.data.settings.takeover = enabled;
            this.store.save();
        }

        mergeWhenAnotherTabSaves() {
            $(pageWindow).on('storage', event => {
                if (event.originalEvent.key !== STORAGE_KEY) return;
                this.store.mergeFromStorage();
                this.library.invalidate();
                this.view.showKnownNoChannelRows();
                this.view.redecorateAll();
            });
        }
    }

    $(document).ready(() => {
        if (!$('#om-panel').length) new PlaylistOrganizer();
    });
})(typeof unsafeWindow === 'undefined' ? window : unsafeWindow);
