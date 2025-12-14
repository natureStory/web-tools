import {
  findDuplicateStrings,
  deduplicateString,
  deduplicateAllStrings,
} from "../app/utilities/deduplicateJsonStrings";

describe("deduplicateJsonStrings", () => {
  describe("findDuplicateStrings", () => {
    it("应该找到简单对象中的重复字符串", () => {
      const json = {
        name: "John",
        title: "Developer",
        role: "Developer",
      };

      const duplicates = findDuplicateStrings(json);

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].value).toBe("Developer");
      expect(duplicates[0].count).toBe(2);
      expect(duplicates[0].paths).toContain("$.title");
      expect(duplicates[0].paths).toContain("$.role");
    });

    it("应该找到数组中的重复字符串", () => {
      const json = {
        tags: ["frontend", "backend", "frontend"],
      };

      const duplicates = findDuplicateStrings(json);

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].value).toBe("frontend");
      expect(duplicates[0].count).toBe(2);
      expect(duplicates[0].paths).toContain("$.tags[0]");
      expect(duplicates[0].paths).toContain("$.tags[2]");
    });

    it("应该找到嵌套对象中的重复字符串", () => {
      const json = {
        user: {
          name: "test",
          profile: {
            nickname: "test",
          },
        },
      };

      const duplicates = findDuplicateStrings(json);

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].value).toBe("test");
      expect(duplicates[0].count).toBe(2);
      expect(duplicates[0].paths).toContain("$.user.name");
      expect(duplicates[0].paths).toContain("$.user.profile.nickname");
    });

    it("应该返回空数组当没有重复时", () => {
      const json = {
        name: "John",
        title: "Developer",
        role: "Engineer",
      };

      const duplicates = findDuplicateStrings(json);

      expect(duplicates).toHaveLength(0);
    });

    it("应该按出现次数降序排序", () => {
      const json = {
        a: "common",
        b: "rare",
        c: "common",
        d: "rare",
        e: "common",
      };

      const duplicates = findDuplicateStrings(json);

      expect(duplicates).toHaveLength(2);
      expect(duplicates[0].value).toBe("common");
      expect(duplicates[0].count).toBe(3);
      expect(duplicates[1].value).toBe("rare");
      expect(duplicates[1].count).toBe(2);
    });

    it("应该忽略非字符串值", () => {
      const json = {
        name: "John",
        age: 30,
        active: true,
        score: null,
        another_name: "John",
      };

      const duplicates = findDuplicateStrings(json);

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].value).toBe("John");
      expect(duplicates[0].count).toBe(2);
    });
  });

  describe("deduplicateString", () => {
    it("应该为重复字符串添加编号", () => {
      const json = {
        title: "Test",
        name: "Test",
        label: "Test",
      };

      const result = deduplicateString(json, "Test");

      expect(result).toEqual({
        title: "Test - 001",
        name: "Test - 002",
        label: "Test - 003",
      });
    });

    it("应该在数组中添加编号", () => {
      const json = {
        tags: ["frontend", "backend", "frontend"],
      };

      const result = deduplicateString(json, "frontend");

      expect(result).toEqual({
        tags: ["frontend - 001", "backend", "frontend - 002"],
      });
    });

    it("应该在嵌套结构中添加编号", () => {
      const json = {
        user: {
          name: "test",
          profile: {
            nickname: "test",
          },
        },
      };

      const result = deduplicateString(json, "test");

      expect(result).toEqual({
        user: {
          name: "test - 001",
          profile: {
            nickname: "test - 002",
          },
        },
      });
    });

    it("应该正确处理已有编号的字符串", () => {
      const json = {
        title: "Test - 001",
        name: "Test - 001",
      };

      const result = deduplicateString(json, "Test - 001");

      expect(result).toEqual({
        title: "Test - 001 - 001",
        name: "Test - 001 - 002",
      });
    });

    it("当没有重复时应该返回原JSON", () => {
      const json = {
        title: "Unique",
      };

      const result = deduplicateString(json, "Unique");

      expect(result).toEqual(json);
    });

    it("应该使用三位数补零", () => {
      const json = {
        a: "x",
        b: "x",
        c: "x",
        d: "x",
        e: "x",
        f: "x",
        g: "x",
        h: "x",
        i: "x",
        j: "x",
        k: "x",
      };

      const result = deduplicateString(json, "x") as any;

      expect(result.a).toBe("x - 001");
      expect(result.j).toBe("x - 010");
      expect(result.k).toBe("x - 011");
    });
  });

  describe("deduplicateAllStrings", () => {
    it("应该为所有重复字符串添加编号", () => {
      const json = {
        title: "Test",
        name: "Test",
        role: "Admin",
        level: "Admin",
      };

      const result = deduplicateAllStrings(json);

      expect(result).toEqual({
        title: "Test - 001",
        name: "Test - 002",
        role: "Admin - 001",
        level: "Admin - 002",
      });
    });

    it("应该保留唯一值不变", () => {
      const json = {
        title: "Test",
        name: "Test",
        unique: "Unique",
      };

      const result = deduplicateAllStrings(json);

      expect(result).toEqual({
        title: "Test - 001",
        name: "Test - 002",
        unique: "Unique",
      });
    });

    it("应该处理复杂嵌套结构", () => {
      const json = {
        users: [
          { name: "John", role: "Admin" },
          { name: "Jane", role: "Admin" },
        ],
        config: {
          title: "John",
        },
      };

      const result = deduplicateAllStrings(json);

      expect(result).toEqual({
        users: [
          { name: "John - 001", role: "Admin - 001" },
          { name: "Jane", role: "Admin - 002" },
        ],
        config: {
          title: "John - 002",
        },
      });
    });

    it("应该返回空对象当输入为空对象", () => {
      const json = {};

      const result = deduplicateAllStrings(json);

      expect(result).toEqual({});
    });
  });
});
