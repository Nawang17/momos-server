const Filter = require("bad-words");

class FilterHacked extends Filter {
  cleanHacked(string) {
    try {
      return this.clean(string);
    } catch {
      const joinMatch = this.splitRegex.exec(string);
      const joinString = (joinMatch && joinMatch[0]) || "";
      return string
        .split(this.splitRegex)
        .map((word) => {
          return this.isProfane(word) ? this.replaceWord(word) : word;
        })
        .join(joinString);
    }
  }
}

module.exports = FilterHacked;
