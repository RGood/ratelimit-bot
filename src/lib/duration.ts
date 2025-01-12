const UNIT_TO_MILLISECONDS = {
    "": 1000,
    "ms": 1,
    "s" : 1000,
    "m" : 1000*60,
    "h" : 1000*60*60,
    "d" : 1000*60*60*24
};

type UNITS = keyof typeof UNIT_TO_MILLISECONDS;

function validateUnitType(unit: string): asserts unit is UNITS {
    if (!(unit in UNIT_TO_MILLISECONDS)) {
        throw new Error(`unknown unit: '${unit}'`);
    }
}

function getUnitMilliseconds(unit: string) {
    validateUnitType(unit);
    return UNIT_TO_MILLISECONDS[unit];
}

export function parseDurationStr(timeStr: string | undefined, outputUnit = "ms") {
    timeStr = timeStr || "";
    const outputScale = getUnitMilliseconds(outputUnit);

    var total = 0;

    var parsingNum = true;
    var numPart = 0;
    var parsingDec = false;
    var decPlace = 1;
    var decPart = 0;
    var unit = "";
    for(let i = 0; i < timeStr.length; i++) {
        const char = timeStr[i];

        if(parsingDec && (+ char) >= 0 && (+ char) <= 9) {
            decPlace *= 10;
            decPart += (+ char) / decPlace;
        } else if((+ char) >= 0 && (+ char) <= 9) {
            if(!parsingNum) {
                const scale = getUnitMilliseconds(unit);

                total += (numPart * scale) + decPart;

                numPart = 0;
                decPlace = 1;
                decPart = 0;
                parsingNum = true;
                unit = "";
            }

            numPart *= 10;
            numPart += (+ char);
        } else if(char === ".") {
            parsingDec = true;
        } else {
            parsingNum = false;
            parsingDec = false;
            unit += char;
        }

    }

    const scale = getUnitMilliseconds(unit);

    total += (numPart * scale) + decPart;

    return total / outputScale;
}
