interface ObjectConstructor {
    /**
     * Returns the names of the enumerable properties and methods of an object.
     * @param o Object that contains the properties and methods. This can be an object that you created or an existing Document Object Model (DOM) object.
     */
    keys<T extends Record<string | number | symbol, any>>(o: T): Array<keyof T>;
}
interface SVGElement {
    getX(): number;
    getY(): number;
    getWidth(): number;
    getHeight(): number;
    getEndX(): number;
}
