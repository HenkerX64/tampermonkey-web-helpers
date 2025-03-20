// ==UserScript==
// @name         Multi-Voucher Submitter
// @namespace    https://github.com/HenkerX64
// @version      1.0
// @description  Расширяет форму для ввода нескольких кодов и обрабатывает каждую строку как отдельную отправку
// @author       HenkerX64
// @homepage     https://github.com/HenkerX64/tampermonkey-web-helpers
// @supportURL   https://github.com/HenkerX64/tampermonkey-web-helpers/issues
// @downloadURL  https://raw.githubusercontent.com/HenkerX64/tampermonkey-web-helpers/main/gameforfarm/multiVoucherSubmitter.user.js
// @updateURL    https://raw.githubusercontent.com/HenkerX64/tampermonkey-web-helpers/main/gameforfarm/multiVoucherSubmitter.user.js
// @match        https://gamesforfarm.com/*client/balance*
// @grant        none
// ==/UserScript==

/*
README (English):
This Tampermonkey script enhances the voucher redemption form by allowing users to input multiple codes at once.
Each code is submitted individually with a small delay to avoid server issues.
The last code is submitted normally, restoring the form's default behavior.
A loading message replaces the submit button during processing.

README (Русский):
Этот скрипт Tampermonkey расширяет форму ввода кодов ваучеров, позволяя пользователям вводить несколько кодов сразу.
Каждый код отправляется отдельно с небольшой задержкой, чтобы избежать проблем с сервером.
Последний код отправляется обычным способом, восстанавливая стандартное поведение формы.
Во время обработки кнопка отправки заменяется на сообщение о загрузке.
*/

(function () {
    'use strict';

    const translations = {
        en: {
            multiModeOn: 'Enter multiple voucher codes',
            multiModeOff: 'Back',
            multiModeSubmit: 'Redeem',
            processing: 'Processing...',
            voucherNotFound: 'Voucher not found:',
            seeUnusedCodes: 'Following voucher codes not used',
            serverError: 'Server error. Please try again.',
        },
        ru: {
            multiModeOn: 'Ввести несколько ваучер-кодов',
            multiModeOff: 'Назад',
            multiModeSubmit: 'Погасить',
            processing: 'Обработка...',
            voucherNotFound: 'Ваучер не найден:',
            seeUnusedCodes: 'Следующие ваучер-коды не использованы',
            serverError: 'Ошибка сервера. Попробуйте снова.',
        }
    };

    const pathStart = location.pathname.split('/', 2).join('');
    const userLang = pathStart === 'client' ? 'ru' : 'en';
    const baseUrl = userLang === 'ru' ? '' : `/${userLang}`;

    function t(key) {
        return translations[userLang][key] || key;
    }

    class MultiVoucherSubmitter {
        constructor() {
            this.form = $(`form[action='${baseUrl}/client/balance/reedemcode/']`);
            /** redeem code form action is not yet available for 'en' */
            if (this.form.length === 0) {
                this.form = $(`form[action='/client/balance/reedemcode/']`);
            }
            this.historyTable = $('.table-responsive:first').parent();
            this.inputField = this.form.find("input[name='code']");
            this.submitButton = this.form.find("input[type='submit']");
            this.orgTextSubmitButton = this.submitButton.val();
            this.isMultiMode = false;
            this.init();
        }

        init() {
            this.createToggleButton();
            this.createTextArea();
            this.attachEventHandlers();
        }

        createToggleButton() {
            this.toggleButton = $(`<button class="btn btn-info btn-block" style="margin-top:10px;">${t('multiModeOn')}</button>`);
            this.inputField.after(this.toggleButton);
        }

        createTextArea() {
            this.textarea = $('<textarea class="form-control" style="display:none; height:100px;"></textarea>');
            this.inputField.after(this.textarea);
        }

        attachEventHandlers() {
            this.toggleButton.click((e) => this.toggleMultiMode(e));
            this.form.submit((e) => this.handleSubmit(e));
        }

        toggleMultiMode(event) {
            event.preventDefault();
            this.isMultiMode = !this.isMultiMode;
            this.updateUI();
        }

        updateUI() {
            this.toggleButton.html(this.isMultiMode ? t('multiModeOff') : t('multiModeOn'));
            this.inputField.toggle(!this.isMultiMode);
            this.textarea.toggle(this.isMultiMode);
            this.submitButton.val(this.isMultiMode ? t('multiModeSubmit') : this.orgTextSubmitButton);
        }

        handleSubmit(event) {
            if (!this.isMultiMode) return;
            event.preventDefault();

            const codes = this.textarea.val().split('\n').map(c => c.trim()).filter(c => c !== '');
            if (codes.length === 0) return;

            this.disableSubmitButton();
            this.processCodes(codes, 0);
        }

        disableSubmitButton() {
            this.submitButton.hide();
            this.loadingText = $(`<span class="btn btn-success btn-block disabled">${t('processing')}</span>`);
            this.submitButton.after(this.loadingText);
        }

        enableSubmitButton() {
            this.loadingText.remove();
            this.submitButton.show();
        }

        processCodes(codes, index) {
            if (index >= codes.length - 1) {
                this.restoreForm(codes[index]);
                return;
            }

            this.inputField.val(codes[index]);

            $.post(this.form.attr('action'), this.form.serialize())
                .done(() => {
                    this.loadDashboardBalanceHistory(() => {
                        if (!this.isCodeInHistory(codes[index])) {
                            this.handleInvalidCode(codes, index);
                            return;
                        }
                        this.scheduleNextCode(codes, index);
                    });
                })
                .fail(() => {
                    alert(t('serverError'));
                    this.enableSubmitButton();
                });
        }

        handleInvalidCode(codes, index) {
            this.closeDialogs();
            this.showNotValidCodesAlert(codes, index);
        }

        scheduleNextCode(codes, index) {
            this.textarea.val(codes.slice(index + 1).join("\n"));
            setTimeout(() => this.processCodes(codes, index + 1), 200);
        }

        closeDialogs() {
            $('button.close').click();
            this.enableSubmitButton();
        }

        showNotValidCodesAlert(codes, index) {
            const unknownCodes = codes.slice(index + 1);

            const alert = $(
                `<div class="alert alert-danger">
						<div class="bg-red alert-icon"><i class="glyph-icon icon-times"></i></div>
						<div class="alert-content">
						    <h4 class="alert-title">${t('voucherNotFound')} "<strong>${codes[index]}</strong>"</h4>
						    <p>${t('seeUnusedCodes')}:</p>
						    <ul>
						        <li>${unknownCodes.join('</li><li>')}</li>
                            </ul>
						</div>
				</div>`
            );
            this.historyTable.prepend(alert);
        }

        loadDashboardBalanceHistory(callback) {
            setTimeout(
                () => this.historyTable
                    .load(
                        [
                            `${baseUrl}/client/dashboard .table-responsive:first`,
                            `.alert:first`,
                            `[href="${baseUrl}/client/balance"] span:first`,
                        ].join(', '),
                        () => {
                            setTimeout(() => callback(), 10);
                        }
                    ),
                200
            );
        }

        isCodeInHistory(code) {
            return this.historyTable.find('.table-responsive:first').text().indexOf(code) >= 0;
        }

        restoreForm(lastCode) {
            this.enableSubmitButton();
            this.textarea.hide();
            this.inputField.show().val(lastCode);
            this.form.unbind('submit').submit();
        }
    }

    $(document).ready(() => new MultiVoucherSubmitter());
})();
