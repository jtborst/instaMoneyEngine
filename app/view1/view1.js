'use strict';

angular.module('myApp.view1', ['ngRoute', "firebase"])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/view1', {
            templateUrl: 'view1/view1.html',
            controller: 'View1Ctrl'
        });
    }])

    .controller('View1Ctrl', function ($firebaseObject, $firebaseArray, $http, $log) {

            var workFB = new Firebase("https://instamoney.firebaseio.com/work_queue");
            var notifyFB = new Firebase("https://instamoney.firebaseio.com/notify_queue");
            const ISA_NL = "NL99INGB2348573645";
            const ISA_NL_AUD = "NL77INGB4758476399";
            const ISA_AUS = "AU484744644";
            const DELAY = 500;


            var notify = $firebaseArray(notifyFB);
            var work = $firebaseArray(workFB);

            window.setInterval(function () {
                if (work.length > 0) {
                    var key = work.$keyAt(0);
                    var order = work.$getRecord(key);
                    pickOrder(order);
                    work.$remove(order).then(function () {
                        $log.info('removed')
                    }, function (error) {
                        $log.info(error);
                    });
                }
            }, 2000);


            ////////////////////////////////////
            function pickOrder(transaction) {

                console.log(transaction.$id);

                if (isValidTransaction(transaction)) {

                    toCurrency(transaction.amount, 'AUD').then(function (amountEUR) {
                        transaction.amountEUR = Math.round(amountEUR * 100) / 100;
                        transferMoney(getAccountRef(transaction.from), transaction.amountEUR, getAccountRef(ISA_NL), transaction.amountEUR, false, transaction)
                            .then(function () {

                                window.setTimeout(function () {
                                    transferMoney(getAccountRef(ISA_NL), transaction.amountEUR, getAccountRef(ISA_NL_AUD), transaction.amount, true, transaction)
                                        .then(function () {
                                            window.setTimeout(function () {
                                                transferMoney(getAccountRef(ISA_NL_AUD), transaction.amount, getAccountRef(ISA_AUS), transaction.amount, true, transaction)
                                                    .then(function () {
                                                        window.setTimeout(function () {
                                                            transferMoney(getAccountRef(ISA_AUS), transaction.amount, getAccountRef(transaction.to), transaction.amount, true, transaction)
                                                                .then(function () {
                                                                    $log.info("transaction " + transaction.amount + " succeeded");
                                                                    handleSuccess(transaction);

                                                                })

                                                        }, DELAY);
                                                    })
                                            }, DELAY);
                                        })
                                }, DELAY);
                            });
                    })
                }
                else {
                    $log.info("transaction rejected");
                    notify.$add({'transaction': transaction, 'message': 'transaction invalid'});

                }
            }

            function isValidTransaction(transaction) {
                if (transaction.$id === null) return false;
                if (transaction.from === null) return false;
                if (transaction.to === null) return false;
                if (transaction.amount === null) return false;
                return true;
            }

            function getAccountRef(accountNumber) {
                $log.info("getting details for");
                $log.info(accountNumber);
                return new Firebase("https://instamoney.firebaseio.com/accounts/" + accountNumber);
            }

            function transferMoney(accountFromRef, amountFrom, accountToRef, amountTo, noBalanceCheck, transactionReference) {
                var accountFrom = $firebaseObject(accountFromRef);

                return accountFrom.$loaded(function () {
                    if (noBalanceCheck || accountFrom.balance > amountFrom) {
                        accountFrom.balance = accountFrom.balance - amountFrom;
                    } else {
                        notify.$add({'transaction': transactionReference, 'message': 'insufficient balance'});
                    }

                    return accountFrom.$save().then(function () {
                        var accountTo = $firebaseObject(accountToRef);

                        return accountTo.$loaded(function () {
                            accountTo.balance = accountTo.balance + amountTo;
                            return accountTo.$save();
                        });

                    });
                })
            }


            function toCurrency(amount, currency) {

                return $http.get('http://api.fixer.io/latest').then(function (data) {

                    return amount / data.data.rates.AUD;
                });
            }

            function handleSuccess(transaction) {
                $log.info("pushing success");

                var toRef = getAccountRef(transaction.to).child('transactions');
                var transactionsTo = $firebaseArray(toRef);
                transactionsTo.$add(transaction);

                var fromRef = getAccountRef(transaction.from).child('transactions');
                var transactionsFrom = $firebaseArray(fromRef);
                transactionsFrom.$add(transaction);

                notify.$add({
                    'transaction': transaction,
                    'message': 'transaction succeeded'
                });
            }
        }
    )
;