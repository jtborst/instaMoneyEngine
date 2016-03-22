'use strict';

angular.module('myApp.view1', ['ngRoute', "firebase"])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/view1', {
            templateUrl: 'view1/view1.html',
            controller: 'View1Ctrl'
        });
    }])

    .controller('View1Ctrl', function ($firebaseArray) {

            var workFB = new Firebase("https://instamoney.firebaseio.com/work_queue");
            var notifyFB = new Firebase("https://instamoney.firebaseio.com/notify_queue");
            const ISA_NL = "NL99INGB2348573645";
            const ISA_AUS = "AU77INGB4758476399";


            var notify = $firebaseArray(notifyFB);
            var work = $firebaseArray(workFB);

            window.setInterval(function () {
                if (work.length > 0) {
                    var key = work.$keyAt(0);
                    pickOrder(work.$getRecord(key));
                }
            }, 10000);


            ////////////////////////////////////
            function pickOrder(transaction) {

                console.log(transaction.$id);

                if (isValidTransaction(transaction)) {
                    var accountFrom = getAccountRef(transaction.to);
                    var accountNL = getAccountRef(ISA_NL);


                } else {
                    notify.push({'transaction': transaction, 'message': 'transaction invalid'});
                }


            }

            function isValidTransaction(transaction) {
                if (transaction.$id == null) return false;
                if (transaction.from == null) return false;
                if (transaction.to == null) return false;
                if (transaction.amount == null) return false;


            }

            function getAccountRef(accountNumber) {
                return new Firebase("https://instamoney.firebaseio.com/accounts/" + accountNumber);
            }

            var accounts = $firebaseArray(accountsFB);


        }
    );