# instaMoneyEngine

Engine moving transactions from the work_queue to the account transaction lists

/work_queue


work queue has transaction objects.

flow: on child_added:
* store item locally, remove from work queue
* subtract account balance of ‘from’ user, add transaction to account transaction list as requested
* add to account balance of bank-nl 
* calculate currency rate, remove from account balance of bank-nl, add to account balance of bank-aus
* remove from account balance of bank-aus, add to account balance of ‘to’ user, add transaction to account transaction list as booked
* set transaction in from account transaction list as booked.