/* global $, ko, StatusText */
/* exported EventLogViewModel */

function EventLogEntryViewModel(data, block, index)
{
  "use strict";

  ko.mapping.fromJS(data, {}, this);
  this.key = ko.observable(block+"-"+index);
  this.block = ko.observable(block);
  this.index = ko.observable(index);
  this.localTime = this.time.extend({ date: true });  this.vehicle = ko.computed(() => { return 0 !== (this.evseFlags & 0x0100); });
  this.estate = StatusText(this.evseState, this.vehicle);
}

function EventLogViewModel(baseEndpoint)
{
  "use strict";
  const endpoint = ko.pureComputed(function () { return baseEndpoint() + "/logs"; });

  var block = 0;
  var index = 0;
  ko.mapping.fromJS({
    min: 0,
    max: 0
  }, {}, this);

  const logsMappingSettings =
  {
    key: (data) => {
      return ko.utils.unwrapObservable(data.key);
    },
    create: (options) => {
      return new EventLogEntryViewModel(options.data, block, index++);
    }
  };

  this.events = ko.mapping.fromJS([], logsMappingSettings);
  this.fetching = ko.observable(false);
  this.fetchingBlock = ko.observable(false);

  this.update = (after = () => { }) => {
    this.fetching(true);
    $.get(endpoint(), (data) => {
      ko.mapping.fromJS(data, this);
      this.updateBlock(this.max(), () => {
        this.fetching(false);
        after();
      });
    }, "json").fail(() => {
      this.fetching(false);
      after();
    });
  };

  this.updateBlock = (fetchBlock, after = () => { }) => {
    this.fetchingBlock(true);
    block = fetchBlock;
    index = 0;
    $.get(endpoint()+"/"+fetchBlock, (data) => {
      ko.mapping.fromJS(data, this.events);
      this.events.sort((left, right) => {
        if(right.block() != left.block()) {
          return right.block() - left.block();
        }
        return right.index() - left.index();
       });
    }, "json").always(() => {
      this.fetchingBlock(false);
      after();
    });
  };
}
