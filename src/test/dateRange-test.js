/* ==============================================================================
 * Licensed under the Apache License, Version 2.0 (the 'License'); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
var range
describe('date range default behavior', function() {
  beforeEach(resetRange)

  it('creates range of three days', function() {
    expect(range.start).toEqual(start)
    expect(range.end).toEqual(end)
    expect(range.days()).toEqual(3)
    expect(range).not.toHaveDate('09/9/2009')
    expect(range).toHaveDate('09/10/2009')
    expect(range).toHaveDate('09/11/2009')
    expect(range).toHaveDate('09/12/2009')
    expect(range).not.toHaveDate('09/13/2009')
    expect(range.toString(DATE_LOCALE_FI)).toEqual('10.9.2009 - 12.9.2009')
  })

  it('range is movable', function() {
    range = range.shiftDays(2)
    expect(range.start.getDate()).toEqual(12)
    expect(range.end.getDate()).toEqual(12 + 2)
  })

  it('range is expandable', function() {
    range = range.expandTo(new Date('09/15/2009'))
    expect(range.days()).toEqual(6)
  })

  it('two ranges can do interception', function() {
    var range2 = createRange('09/11/2009', '09/19/2009')
    expect(range.and(range2).days()).toEqual(2)
    range2 = createRange('09/16/2009', '09/19/2009')
    expect(range.and(range2).days()).toEqual(0)
  })

  it('range can be asked if it is a subset of another range', function() {
    expect(range).toBeInside(range)
    expect(range).not.toBeInside(range.shiftDays(1))
    expect(range).toBeInside(range.expandDaysTo(7))
    expect(range.expandDaysTo(7)).not.toBeInside(range)
  })
})

describe('moving date range within outer range', function() {
  beforeEach(resetOuterRange)

  it('range already inside outer range is not moved', function() {
    var range1 = createRange('04/04/2011', '04/10/2011')
    var range2 = range1.shiftInside(outerRange)
    expect(range1).toBeInside(outerRange)
    expect(range2).toBeInside(outerRange)
    expect(range1.start.getDate()).toEqual(range2.start.getDate())
    expect(range1.end.getDate()).toEqual(range2.end.getDate())
  })

  it('range can be moved forward inside outer range', function() {
    var range1 = createRange('03/15/2011', '03/21/2011')
    var range2 = range1.shiftInside(outerRange)
    expect(range1).not.toBeInside(outerRange)
    expect(range2).toBeInside(outerRange)
    expect(range2.start.getDate()).toEqual(28)
    expect(range2.end.getDate()).toEqual(3)
  })

  it('range can be moved backward inside outer range', function() {
    var range1 = createRange('04/28/2011', '05/04/2011')
    var range2 = range1.shiftInside(outerRange)
    expect(range1).not.toBeInside(outerRange)
    expect(range2).toBeInside(outerRange)
    expect(range2.start.getDate()).toEqual(25)
    expect(range2.end.getDate()).toEqual(1)
  })

  it('range longer than outer range cannot be moved', function() {
    var range1 = new DateRange(outerRange.start.plusDays(-1), outerRange.end.plusDays(1))
    var range2 = range1.shiftInside(outerRange)
    expect(range2.days()).toEqual(0)
  })
})

describe('date range with minimum size within outer range', function() {
  beforeEach(resetOuterRange)

  it('range can be requested near the beginning of outer range', function() {
    var oldRange = createRange('03/28/2011', '04/03/2011')
    var newRange = DateRange.rangeWithMinimumSize(oldRange, 7, true, outerRange)
    expect(newRange.days()).toEqual(7)
    expect(newRange.start.getDate()).toEqual(29)
    expect(newRange.end.getDate()).toEqual(4)
  })

  it('range can be requested near the end of outer range', function() {
    var oldRange = createRange('04/25/2011', '04/25/2011')
    var newRange = DateRange.rangeWithMinimumSize(oldRange, 7, false, outerRange)
    expect(newRange.days()).toEqual(7)
  })

  it('range cannot be requested to be outside outer range', function() {
    var oldRange = createRange('04/26/2011', '04/26/2011')
    var newRange = DateRange.rangeWithMinimumSize(oldRange, 7, false, outerRange)
    expect(newRange.days()).toEqual(0)
  })

  it('range may not be found near the end of outer range due to weekends', function() {
    var oldRange = createRange('04/24/2011', '04/24/2011')
    var newRange = DateRange.rangeWithMinimumSize(oldRange, 7, true, outerRange)
    expect(newRange.days()).toEqual(0)
  })
})

describe('date range with time behavior', function() {
  beforeEach(resetRange)

  it('date range can have times', function() {
    DATE_LOCALE_EN.init()
    range.setTimes('10:00', '14:45')
    expect(range.days()).toEqual(2)
    expect(range.hours()).toEqual(4)
    expect(range.minutes()).toEqual(45)
    expect(range.toString()).toEqual('2 Days 4.75 Hours')

    DATE_LOCALE_FI.init()
    expect(range.toString()).toEqual('2 päivää 4,75 tuntia')

    range.setTimes('17:00', '16:00')
    expect(range.days()).toEqual(1)
    expect(range.hours()).toEqual(23)
    expect(range.minutes()).toEqual(0)
    range.start = range.start.plusDays(1)

    range.setTimes('10:00', '11:00')
    expect(range.toString()).toEqual('1 päivä 1 tunti')

    DATE_LOCALE_EN.init()
    expect(range.toString()).toEqual('1 Day 1 Hour')
  })

  it('one day range with start time after end time is not valid', function() {
    expect(range).toBeValidRange()
    range.start = new Date('09/13/2009')
    expect(range).not.toBeValidRange()
    range.start = new Date('09/12/2009')
    expect(range).toBeValidRange()
    range.setTimes('15:00', '14:30')
    expect(range).not.toBeValidRange()
    range.setTimes('15:00', '15:00')
    expect(range).toBeValidRange()
    range.setTimes('15:00', '15:30')
    expect(range).toBeValidRange()
  })

  it('invalid time will make range invalid while keeping date information', function() {
    range.setTimes('15:00', '15:30')
    expect(range).toBeValidRange()

    range.setTimes('', '15:30')
    expect(range).not.toBeValidRange()

    range.setTimes('15:00', '15:30')
    expect(range).toBeValidRange()

    range.setTimes('asdf', 'fddd')
    expect(range).not.toBeValidRange()

    range.setTimes('00', '25')
    expect(range).not.toBeValidRange()

  })

  it('different time formats are accepted', function() {
    range.setTimes('15:00', '16:10')
    assertHasCorrectHoursAndMinutes(1, 10)

    range.setTimes('14.00', '16.20')
    assertHasCorrectHoursAndMinutes(2, 20)

    range.setTimes('13,00', '16,30')
    assertHasCorrectHoursAndMinutes(3, 30)

    range.setTimes('1200', '1640')
    assertHasCorrectHoursAndMinutes(4, 40)

    range.setTimes('830', '1240')
    assertHasCorrectHoursAndMinutes(4, 10)

    range.setTimes('08', '13')
    assertHasCorrectHoursAndMinutes(5, 0)
  })

  it('minutes are rounded to 2 digits', function() {
    range.setTimes('15:00', '16:10')
    assertHasCorrectHoursAndMinutes(1, 10)
    DATE_LOCALE_FI.init()
    expect(range.toString()).toEqual('2 päivää 1,17 tuntia')
  })

  it('range is displayed with the most defining unit', function() {
    range = createRange('01/01/2004', '05/01/2006')
    expect(range).toPrintDefiningDurationOf('2 vuotta')
    range = createRange('01/01/2004', '05/01/2005')
    expect(range).toPrintDefiningDurationOf('1 vuosi')
    range = createRange('01/01/2004', '05/01/2004')
    expect(range).toPrintDefiningDurationOf('4 kuukautta')
    range = createRange('01/01/2004', '02/16/2004')
    expect(range).toPrintDefiningDurationOf('1 kuukausi')
    range = createRange('01/01/2004', '01/31/2004')
    expect(range).toPrintDefiningDurationOf('1 kuukausi')
    range = createRange('01/01/2004', '01/07/2004')
    expect(range).toPrintDefiningDurationOf('7 päivää')
  })
})

function assertHasCorrectHoursAndMinutes(hours, minutes) {
  expect(range).toBeValidRange()
  expect(range.hours()).toEqual(hours)
  expect(range.minutes()).toEqual(minutes)
} 

function resetRange() {
  start = new Date('09/10/2009')
  end = new Date('09/12/2009')
  range = new DateRange(end, start)
}

function resetOuterRange() {
  start = new Date('03/28/2011')
  end = new Date('05/01/2011')
  outerRange = new DateRange(start, end)
}

function createRange(date1, date2) {
  return new DateRange(new Date(date1), new Date(date2))
}
