import p2 from 'p2';
import { BRUSH, PARTICLES, PLANES } from './CollisionGroups';

export default class Brush {
    constructor({id, x = 0, y = 0, angle = 0, own = false, world, socket}){
        this.id = id
        this.isOwnBox = own
        this.world = world
        this.socket = socket
        this.shape = null
        this.shapeType = null

        this.fillStyle = "#0000ff"
        this.fillImage = null
        this.strokeStyle = "#ff0000"

        this.body = new p2.Body({
            mass: 100,
            position: [x, y],
            angle: angle,
            angularVelocity: 1
        })

        this.Shape = "CIRCLE"
        this.world.addBody(this.body)
    }

    set Fill(color){
        this.fillStyle = color
        this.fillImage = null
        if (this.socket)
            this.socket.emit('setFillStyle', color)
    }

    set Stroke(color){
        this.strokeStyle = color
        if (this.socket)
            this.socket.emit('setStrokeStyle', color)
    }

    set Image(src){
        const img = new Image()
        img.src = src
        this.fillImage = img
        if (this.socket)
            this.socket.emit('setFillImage', src)
    }

    set Shape(shapeType){
        this.body.removeShape(this.shape)
        switch (shapeType) {
            case "CIRCLE": this.setCircleShape(50)
            break
            case "BOX": this.setSquareShape(100, 50) 
            break
            case "SQUARE": this.setSquareShape(75, 75) 
            break
        }
        this.shapeType = shapeType
        this.shape.collisionGroup = BRUSH
        setTimeout(() => {
            this.shape.collisionMask = BRUSH | PLANES | PARTICLES
        }, 1000)
        this.body.addShape(this.shape)
        this.updateShape()
        if (this.socket)
            this.socket.emit('setShapeType', shapeType)
    }

    setCircleShape(radius){
        this.shape = new p2.Circle({radius})
    }

    setSquareShape(width, height){
        this.shape = new p2.Box({width, height})
        this.height = this.shape.height
        this.width = this.shape.width
        this.vertices = [[], [], [], []]
        for(let i = 0; i < this.shape.vertices.length; i++){
            this.vertices[i][0] = this.shape.vertices[i][0]
            this.vertices[i][1] = this.shape.vertices[i][1]
        }
    }

    render(ctx){
        this.adjustSize()
        this.draw(ctx)
    }

    adjustSize(){
        const factor = this.calculateSizeFactor()

        switch (this.shapeType) {
            case "CIRCLE": this.adjustCircle(factor)
            break
            case "BOX":
            case "SQUARE": this.adjustSquare(factor)
            break
        }
        
        this.updateShape()
    }

    adjustCircle(factor){
        this.shape.radius = 50 * factor
    }

    adjustSquare(factor){
        this.shape.width = factor * this.width 
        this.shape.height = factor * this.height 
        this.shape.vertices.forEach((vertex, index, array) => {
            array[index][0] = factor * this.vertices[index][0]
            array[index][1] = factor * this.vertices[index][1]
        })
    }

    calculateSizeFactor(){
        const max = 2
        let factor = (this.body.velocity[0] + this.body.velocity[1]) * 0.005
        
        factor = Math.abs(factor)
        factor = factor < 1 ? 1 : factor
        factor = factor > max ? max : factor

        return factor
    }

    updateShape() {
        if (this.shape.updateTriangles)
            this.shape.updateTriangles()

        if (this.shape.updateCenterOfMass)
            this.shape.updateCenterOfMass()

        if (this.shape.updateBoundingRadius)
            this.shape.updateBoundingRadius()

        if (this.shape.updateArea)
            this.shape.updateArea()
    }

    draw(ctx){
        ctx.beginPath()
        let x = this.body.interpolatedPosition[0]
        let y = this.body.interpolatedPosition[1]
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(this.body.interpolatedAngle)
        ctx.strokeStyle = this.strokeStyle
        this.drawShape(ctx)
        ctx.fillStyle = this.fillStyle
        ctx.lineWidth = 4
        ctx.fill()
        ctx.stroke()
        ctx.restore()
    }

    drawShape(ctx){
        switch (this.shapeType) {
            case "CIRCLE": this.drawCircle(ctx)
            break
            case "BOX":
            case "SQUARE": this.drawRect(ctx)
            break
        }
    }

    drawCircle(ctx){
        if(this.fillImage){
            ctx.beginPath()
            ctx.arc(0, 0, this.shape.radius, 0, Math.PI*2)
            ctx.clip()

            const ratioW = this.shape.radius*2 / this.fillImage.width
            const ratioH = this.shape.radius*2 / this.fillImage.height

            ctx.beginPath()
            ctx.drawImage(this.fillImage,
                -this.shape.radius,
                -this.shape.radius,
                this.fillImage.width*ratioW,
                this.fillImage.height*ratioH)
        }else{
            ctx.arc(0, 0, this.shape.radius, 0, Math.PI*2)
        }
    }

    drawRect(ctx){
        if(this.fillImage){
            ctx.drawImage(this.fillImage,
                -this.shape.width / 2,
                -this.shape.height / 2,
                this.shape.width,
                this.shape.height)
        }else{
            ctx.rect(-this.shape.width / 2, -this.shape.height / 2, this.shape.width, this.shape.height)
        }
    }
}
