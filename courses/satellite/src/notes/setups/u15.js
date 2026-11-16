/** Unit 15 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  learning: [
    { tag: 'one craft', lab: 'learning', scenario: 'one', read: (c) => ({ 'programme (USD M)': [c.total, 4] }) },
    { tag: 'ten at 95%', lab: 'learning', scenario: 'ten', read: (c) => ({ 'production (USD M)': [c.sum, 8.95], 'tenth (USD M)': [c.last, 0.843], 'per craft (USD M)': [c.average, 1.2] }) },
    { tag: 'a hundred at 85%', lab: 'learning', scenario: 'hundred', read: (c) => ({ 'production (USD M)': [c.sum, 43.8], 'hundredth (USD M)': [c.last, 0.34], 'per craft (USD M)': [c.average, 0.468], 'with no learning (USD M)': [c.avgNoLearning, 1.03] }) },
  ],
  confidence: [
    { tag: 'a mature design', lab: 'reserve', scenario: 'mature', read: (c) => ({ 'estimates (USD M)': [c.mean, 3.25], 'reserve (USD k)': [c.reserve * 1000, 59], 'added alone (USD k)': [c.eachReserve * 1000, 121] }) },
    { tag: 'a new magnetometer', lab: 'reserve', scenario: 'new', read: (c) => ({ 'reserve (USD k)': [c.reserve * 1000, 90], 'magnetometer share': [c.largestShare, 0.57] }) },
  ],
};
