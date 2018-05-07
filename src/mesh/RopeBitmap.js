import Mesh from './Mesh';
import core from '../core';

export default class RopeBitmap extends Mesh
{
    /**
     * @param {PIXI.Texture} texture - The texture to use on the rope.
     * @param {PIXI.Point[]} points - An array of {@link PIXI.Point} objects to construct this rope.
     */
    constructor(texture, points)
    {
        super(texture);
        if(points) {
            this.setPoints(points);
        }
    }

    setPoints(points) {
        /**
         * An array of points that determine the rope
         *
         * @member {PIXI.Point[]}
         */
        this.points = points;

        /**
         * An array of vertices used to construct this rope.
         *
         * @member {Float32Array}
         */
        this.vertices = new Float32Array(points.length * 4);

        /**
         * The WebGL Uvs of the rope.
         *
         * @member {Float32Array}
         */
        this.uvs = new Float32Array(points.length * 4);

        /**
         * An array containing the color components
         *
         * @member {Float32Array}
         */
        this.colors = new Float32Array(points.length * 2);

        /**
         * An array containing the indices of the vertices
         *
         * @member {Uint16Array}
         */
        this.indices = new Uint16Array(points.length * 2);

        /**
         * refreshes vertices on every updateTransform
         * @member {boolean}
         * @default true
         */
        this.autoUpdate = true;

        this.refresh();
    }

    /**
     * Refreshes
     *
     */
    refresh()
    {
        const points = this.points;
        if(!points) return;
        // if too little points, or texture hasn't got UVs set yet just move on.
        if (points.length < 1 || !this._texture._uvs)
        {
            return;
        }

        // if the number of points has changed we will need to recreate the arraybuffers
        if (this.vertices.length / 4 !== points.length)
        {
            this.vertices = new Float32Array(points.length * 4);
            this.uvs = new Float32Array(points.length * 4);
            this.colors = new Float32Array(points.length * 2);
            this.indices = new Uint16Array(points.length * 2);
        }

        const uvs = this.uvs;

        const indices = this.indices;
        const colors = this.colors;

        uvs[0] = 0;
        uvs[1] = 0;
        uvs[2] = 0;
        uvs[3] = 1;

        colors[0] = 1;
        colors[1] = 1;

        indices[0] = 0;
        indices[1] = 1;

        const total = points.length;
        //距离的偏移量
        let disOffset = 0;
        for (let i = 1; i < total; i++)
        {
            const point = points[i];
            //上一个点和这个点的距离
            var distance = core.Point.distance(points[i - 1], point);
            var distancePercent = distance / this._texture.frame.width;
            disOffset += distancePercent;
            // time to do some smart drawing!
            let index = i * 4;
            const amount = i / (total - 1);

            uvs[index] = offset.x + disOffset;
            uvs[index+1] = 0 + offset.y;

            uvs[index+2] = offset.x + disOffset;
            uvs[index+3] = 1 * factor.y + offset.y;
            /*
            uvs[index] = amount;
            uvs[index + 1] = 0;

            uvs[index + 2] = amount;
            uvs[index + 3] = 1;
            */
            index = i * 2;
            colors[index] = 1;
            colors[index + 1] = 1;

            index = i * 2;
            indices[index] = index;
            indices[index + 1] = index + 1;
        }

        // ensure that the changes are uploaded
        this.dirty++;
        this.indexDirty++;

        this.multiplyUvs();
        this.refreshVertices();
    }

    /**
     * refreshes vertices of Rope mesh
     */
    refreshVertices()
    {
        const points = this.points;
        if(!points) return;

        if (points.length < 1)
        {
            return;
        }

        let lastPoint = points[0];
        let nextPoint;
        let perpX = 0;
        let perpY = 0;

        // this.count -= 0.2;

        const vertices = this.vertices;
        const total = points.length;

        for (let i = 0; i < total; i++)
        {
            const point = points[i];
            const index = i * 4;

            if (i < points.length - 1)
            {
                nextPoint = points[i + 1];
            }
            else
            {
                nextPoint = point;
            }

            perpY = -(nextPoint.x - lastPoint.x);
            perpX = nextPoint.y - lastPoint.y;

            let ratio = (1 - (i / (total - 1))) * 10;

            if (ratio > 1)
            {
                ratio = 1;
            }

            const perpLength = Math.sqrt((perpX * perpX) + (perpY * perpY));
            const num = this._texture.height / 2; // (20 + Math.abs(Math.sin((i + this.count) * 0.3) * 50) )* ratio;

            perpX /= perpLength;
            perpY /= perpLength;

            perpX *= num;
            perpY *= num;

            vertices[index] = point.x + perpX;
            vertices[index + 1] = point.y + perpY;
            vertices[index + 2] = point.x - perpX;
            vertices[index + 3] = point.y - perpY;

            lastPoint = point;
        }
    }

    /**
     * Updates the object transform for rendering
     *
     * @private
     */
    updateTransform()
    {
        if (this.autoUpdate)
        {
            this.refreshVertices();
        }
        this.containerUpdateTransform();
    }

}
