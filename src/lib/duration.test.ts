import { describe, it, expect } from 'vitest';

import { parseDurationStr } from './duration.js';


describe("timeStrToSeconds", () => {
    it("should parse various strings correctly", () => {
        const r1 = parseDurationStr("1.5s");
        expect(r1).toEqual(1500);

        const r2 = parseDurationStr("5678ms");
        expect(r2).toEqual(5678);

        const r3 = parseDurationStr("1d7h");
        expect(r3).toEqual(111600000);
    });

    it("should adjust output to output unit", () => {
        const r1 = parseDurationStr("1.5s", "ms");
        expect(r1).toEqual(1500);

        const r2 = parseDurationStr("36s", "h");
        expect(r2).toEqual(0.01);
    });

    it("should parse multiple sections", () => {
        const r1 = parseDurationStr("1s500ms");
        expect(r1).toEqual(1500);
    });

    it("should parse parts without a unit as seconds", () => {
        const r3 = parseDurationStr("1d7h66");
        expect(r3).toEqual(111666000);
    });

    it("should throw for parts with invalid units", () => {
        expect(() => { parseDurationStr("1asdf") }).toThrowError();
    });

    it("should throw for bad unit respones type", () => {
        expect(() => { parseDurationStr("1s", "asdf") }).toThrowError();
    });
});
